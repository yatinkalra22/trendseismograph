"""
Zerve block: score_api
Type: Python (publish as HTTP endpoint via Zerve's Deploy panel)
Depends on: load_trends, fetch_google_trends, fetch_youtube, fetch_wikipedia,
            classify_discourse, score_sentiment, compute_tps
Endpoint signature: score(trend_slug: str) -> dict

Reads the cached pipeline outputs (the DAG re-runs upstream blocks on
demand, so requesting a single slug recomputes only what's needed).
Returns the same shape as the original NestJS `/api/trends/:slug/score`
response so the existing frontend contracts still apply.

Publish: in the Zerve canvas, open this block, click Deploy > Create API
endpoint, expose `score` as the handler. The endpoint URL goes into the
demo (Day 4 deliverable 1) and the Devpost submission.
"""
from typing import Any

import pandas as pd

from zerve import variable

trends_df = variable("load_trends", "trends_df")
gtrends_daily = variable("fetch_google_trends", "gtrends_daily")
gtrends_peaks = variable("fetch_google_trends", "gtrends_peaks")
youtube_videos = variable("fetch_youtube", "youtube_videos")
wiki_pageviews = variable("fetch_wikipedia", "wiki_pageviews")
discourse_per_trend = variable("classify_discourse", "discourse_per_trend")
sentiment_per_trend = variable("score_sentiment", "sentiment_per_trend")
scored_trends = variable("compute_tps", "scored_trends")


def _series(df: pd.DataFrame, slug: str, date_col: str, val_col: str) -> pd.Series:
    if df.empty: return pd.Series(dtype=float)
    s = df[df["slug"] == slug].sort_values(date_col)
    return s.set_index(date_col)[val_col] if not s.empty else pd.Series(dtype=float)


def _sparkline(series: pd.Series, n: int = 30) -> list[dict]:
    if series.empty: return []
    tail = series.tail(n)
    return [{"date": str(d.date() if hasattr(d, "date") else d), "value": float(v)}
            for d, v in tail.items()]


def score(trend_slug: str) -> dict[str, Any]:
    if not trend_slug:
        return {"error": "trend_slug is required"}

    row = scored_trends[scored_trends["slug"] == trend_slug]
    if row.empty:
        valid = scored_trends["slug"].tolist() if len(scored_trends) else []
        return {"error": f"unknown trend_slug: {trend_slug}", "available": valid[:20]}
    row = row.iloc[0]

    peak_row = gtrends_peaks[gtrends_peaks["slug"] == trend_slug] if len(gtrends_peaks) else pd.DataFrame()
    peak_iso = str(pd.Timestamp(peak_row.iloc[0]["peak_date"]).date()) if not peak_row.empty else None

    google_series = _series(gtrends_daily, trend_slug, "date", "interest")
    wiki_series = _series(wiki_pageviews, trend_slug, "date", "views")

    yt = youtube_videos[youtube_videos["slug"] == trend_slug] if len(youtube_videos) else pd.DataFrame()
    n_videos = int(len(yt))
    n_comments_classified = int(
        discourse_per_trend.loc[discourse_per_trend["slug"] == trend_slug, "n_comments_classified"].iloc[0]
    ) if not discourse_per_trend.empty and (discourse_per_trend["slug"] == trend_slug).any() else 0

    return {
        "slug": str(row["slug"]),
        "name": str(row["name"]),
        "category": str(row["category"]),
        "tipping_point_score": float(row["tipping_point_score"]),
        "discourse_stage": str(row["discourse_stage"]),
        "stage_confidence": float(row["stage_confidence"]),
        "sub_scores": {
            "google_velocity":   float(row["google_velocity_score"]),
            "discourse":         float(row["discourse_score"]),
            "stage_momentum":    float(row["stage_momentum_score"]),
            "cross_platform":    float(row["cross_platform_score"]),
        },
        "weights": {"google_velocity": 0.30, "discourse": 0.25,
                    "stage_momentum": 0.25, "cross_platform": 0.20},
        "signals": {
            "google_velocity_pct":     float(row["google_velocity_pct"]),
            "video_upload_growth_pct": float(row["video_upload_growth_pct"]),
            "wiki_growth_pct":         float(row["wiki_growth_pct"]),
            "comment_density":         float(row["comment_density"]),
            "sentiment":               float(row["sentiment"]),
            "days_in_current_stage":   int(row["days_in_current_stage"]),
            "n_videos_sampled":        n_videos,
            "n_comments_classified":   n_comments_classified,
        },
        "sparklines": {
            "google_interest": _sparkline(google_series, 30),
            "wikipedia_views": _sparkline(wiki_series, 30),
        },
        "google_peak_date_5y": peak_iso,
    }


# Quick smoke test (runs once when the block is executed in the canvas)
if len(scored_trends):
    sample_slug = str(scored_trends.iloc[0]["slug"])
    print(f"smoke test: score({sample_slug!r})")
    out = score(sample_slug)
    print({k: out[k] for k in ("slug", "tipping_point_score", "discourse_stage")})
