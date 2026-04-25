"""
Zerve block: compute_tps
Type: Python
Depends on:
    load_trends, fetch_google_trends, fetch_youtube, fetch_wikipedia,
    classify_discourse, score_sentiment
Outputs:
    scored_trends : DataFrame (slug, name, category, tipping_point_score,
                               discourse_stage, stage_confidence,
                               google_velocity_score, discourse_score,
                               stage_momentum_score, cross_platform_score,
                               <feature columns used to compute each>)
    tps_weights   : dict of the four formula weights, for audit / display

Faithful port of `apps/backend/src/modules/scoring/scoring.service.ts`:
    TPS = (gv*0.30 + d*0.25 + sm*0.25 + cp*0.20) * 10, clipped to [0, 10].
Weights and thresholds are identical to the TypeScript source. Only the
discourse-term inputs are remapped from Reddit to YouTube per the plan.
"""
import math

import numpy as np
import pandas as pd

from zerve import variable

trends_df = variable("load_trends", "trends_df")
gtrends_daily = variable("fetch_google_trends", "gtrends_daily")
youtube_videos = variable("fetch_youtube", "youtube_videos")
wiki_pageviews = variable("fetch_wikipedia", "wiki_pageviews")
discourse_per_trend = variable("classify_discourse", "discourse_per_trend")
sentiment_per_trend = variable("score_sentiment", "sentiment_per_trend")

WEIGHTS = {"google_velocity": 0.30, "discourse": 0.25, "stage_momentum": 0.25,
           "cross_platform": 0.20}
DISCOURSE_INNER = {"post_growth": 0.5, "sentiment": 0.3, "comment_density": 0.2}
SPIKING_THRESHOLDS = {"google_velocity": 20, "video_growth": 30, "wiki_growth": 25}
STAGE_AGE_THRESHOLD_PCT = 0.5
STAGE_AGE_CAP_DAYS = 30


def _pct_change_7d(series: pd.Series) -> float:
    if len(series) < 14:
        return 0.0
    last7 = series.tail(7).mean()
    prior7 = series.iloc[-14:-7].mean()
    if prior7 <= 0:
        return 0.0
    return float((last7 - prior7) / prior7 * 100.0)


def _video_upload_growth(slug_videos: pd.DataFrame) -> float:
    if slug_videos.empty:
        return 0.0
    pub = pd.to_datetime(slug_videos["published_at"], utc=True, errors="coerce").dropna()
    if pub.empty:
        return 0.0
    cutoff = pub.max()
    last14 = ((cutoff - pub).dt.days <= 14).sum()
    prior14 = (((cutoff - pub).dt.days > 14) & ((cutoff - pub).dt.days <= 28)).sum()
    if prior14 == 0:
        return 100.0 if last14 > 0 else 0.0
    return float((last14 - prior14) / prior14 * 100.0)


def _days_in_current_stage(daily: pd.Series) -> int:
    if daily.empty:
        return 0
    current = daily.tail(7).mean()
    if current <= 0:
        return 0
    threshold = current * STAGE_AGE_THRESHOLD_PCT
    above = daily >= threshold
    if not above.any():
        return 0
    last_below = (~above[::-1]).idxmax() if (~above).any() else above.index[0]
    days = (daily.index[-1] - last_below).days if hasattr(daily.index[-1], "to_pydatetime") else len(daily) - daily.index.get_loc(last_below)
    return int(min(max(days, 0), 90))


def _normalize_google_velocity(velocity: float) -> float:
    return min(max(velocity / 100.0, 0.0), 2.0) / 2.0


def _compute_discourse_score(post_growth: float, sentiment: float, comment_density: float) -> float:
    g = min(post_growth / 100.0, 1.0) if post_growth > 0 else 0.0
    s = (sentiment + 1.0) / 2.0
    d = min(comment_density / 50.0, 1.0)
    return g * DISCOURSE_INNER["post_growth"] + s * DISCOURSE_INNER["sentiment"] + d * DISCOURSE_INNER["comment_density"]


def _compute_stage_momentum(days_in_stage: int, confidence: float) -> float:
    speed = max(1.0 - (days_in_stage / STAGE_AGE_CAP_DAYS), 0.0)
    return speed * confidence


def _compute_cross_platform(google_velocity: float, video_growth: float, wiki_growth: float) -> float:
    spiking = 0
    if google_velocity > SPIKING_THRESHOLDS["google_velocity"]: spiking += 1
    if video_growth > SPIKING_THRESHOLDS["video_growth"]: spiking += 1
    if wiki_growth > SPIKING_THRESHOLDS["wiki_growth"]: spiking += 1
    return spiking / 3.0


def _score_to_stage(score: float) -> str:
    if score < 3: return "discovery"
    if score < 5: return "early_adoption"
    if score < 7: return "approaching_tipping"
    if score < 8.5: return "tipping_point"
    return "mainstream"


rows: list[dict] = []
for _, t in trends_df.iterrows():
    slug = t["slug"]
    g = gtrends_daily[gtrends_daily["slug"] == slug].sort_values("date").set_index("date")["interest"] if len(gtrends_daily) else pd.Series(dtype=float)
    w = wiki_pageviews[wiki_pageviews["slug"] == slug].sort_values("date").set_index("date")["views"] if len(wiki_pageviews) else pd.Series(dtype=float)
    yv = youtube_videos[youtube_videos["slug"] == slug] if len(youtube_videos) else pd.DataFrame()

    google_velocity = _pct_change_7d(g)
    video_growth = _video_upload_growth(yv)
    wiki_growth = _pct_change_7d(w)
    comment_density = float(yv["comment_count"].mean()) if not yv.empty else 0.0
    sent_row = sentiment_per_trend[sentiment_per_trend["slug"] == slug]
    sentiment = float(sent_row["sentiment_score"].iloc[0]) if not sent_row.empty else 0.0
    disc_row = discourse_per_trend[discourse_per_trend["slug"] == slug]
    stage = disc_row["discourse_stage"].iloc[0] if not disc_row.empty else "discovery"
    stage_confidence = float(disc_row["stage_confidence"].iloc[0]) if not disc_row.empty else 0.5
    days_in_stage = _days_in_current_stage(g)

    gv = _normalize_google_velocity(google_velocity)
    d = _compute_discourse_score(video_growth, sentiment, comment_density)
    sm = _compute_stage_momentum(days_in_stage, stage_confidence)
    cp = _compute_cross_platform(google_velocity, video_growth, wiki_growth)
    tps_raw = (gv * WEIGHTS["google_velocity"] + d * WEIGHTS["discourse"]
               + sm * WEIGHTS["stage_momentum"] + cp * WEIGHTS["cross_platform"]) * 10
    tps = round(min(max(tps_raw, 0.0), 10.0), 2)

    rows.append({
        "slug": slug, "name": t["name"], "category": t["category"],
        "tipping_point_score": tps,
        "discourse_stage": stage, "stage_confidence": stage_confidence,
        "google_velocity_score": round(gv, 3), "discourse_score": round(d, 3),
        "stage_momentum_score": round(sm, 3), "cross_platform_score": round(cp, 3),
        "google_velocity_pct": round(google_velocity, 2),
        "video_upload_growth_pct": round(video_growth, 2),
        "wiki_growth_pct": round(wiki_growth, 2),
        "comment_density": round(comment_density, 2),
        "sentiment": round(sentiment, 3),
        "days_in_current_stage": days_in_stage,
    })

scored_trends = pd.DataFrame(rows).sort_values("tipping_point_score", ascending=False).reset_index(drop=True)
tps_weights = WEIGHTS

print(f"Scored {len(scored_trends)} trends. Top 10 by TPS:")
print(scored_trends[["slug", "tipping_point_score", "discourse_stage"]].head(10).to_string(index=False))
