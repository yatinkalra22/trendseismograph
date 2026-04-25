"""
Zerve block: backtest
Type: Python
Depends on: load_trends, fetch_google_trends, fetch_historical
Outputs:
    backtest_results    : DataFrame (slug, name, category, peak_date, predicted_score,
                                     predicted_stage, actual_outcome, was_correct,
                                     weeks_before_peak)
    backtest_accuracy   : dict with overall_accuracy, ci95 {lower, upper},
                          total_trends, evaluated_trends, correct_predictions,
                          avg_weeks_before_peak, category_accuracy
    backtest_outcome_metrics : dict with precision, recall, f1, confusion_matrix
    backtest_weeks_dist : dict with min, p50, p90, max
    signature_timeline  : DataFrame (slug, snapshot_date, tps, google_interest)

Faithful port of `apps/backend/src/modules/backtest/backtest.service.ts`
(`computeWilson95`, `computeOutcomeMetrics`, `computeWeeksDistribution`).
The TPS formula and weights match cell 08 / `scoring.service.ts`. For the
historical backtest, GDELT volume/tone substitute for the YouTube discourse
inputs since YouTube comments cannot be reconstructed at past dates.
"""
import math
from datetime import timedelta

import numpy as np
import pandas as pd

from zerve import variable

trends_df = variable("load_trends", "trends_df")
gtrends_peaks = variable("fetch_google_trends", "gtrends_peaks")
hist_gtrends = variable("fetch_historical", "hist_gtrends")
hist_wiki = variable("fetch_historical", "hist_wiki")
hist_gdelt = variable("fetch_historical", "hist_gdelt")

WEIGHTS = {"google_velocity": 0.30, "discourse": 0.25, "stage_momentum": 0.25, "cross_platform": 0.20}
DISCOURSE_INNER = {"post_growth": 0.5, "sentiment": 0.3, "comment_density": 0.2}
SPIKING = {"google_velocity": 20, "video_growth": 30, "wiki_growth": 25}
LEAD_WEEKS = 4
SNAPSHOT_WEEKS = list(range(-12, 5))
TPS_POSITIVE_THRESHOLD = 7.0
POSITIVE_STAGES = {"approaching_tipping", "tipping_point", "mainstream", "saturation"}


def _pct_change_7d(series: pd.Series) -> float:
    if len(series) < 14: return 0.0
    last7 = series.tail(7).mean()
    prior7 = series.iloc[-14:-7].mean()
    return float((last7 - prior7) / prior7 * 100.0) if prior7 > 0 else 0.0


def _mean_last(series: pd.Series, n: int) -> float:
    return float(series.tail(n).mean()) if len(series) else 0.0


def _days_in_current_stage(daily: pd.Series) -> int:
    if daily.empty: return 0
    current = daily.tail(7).mean()
    if current <= 0: return 0
    threshold = current * 0.5
    above = daily >= threshold
    if not above.any(): return 0
    last_below_idx = (~above[::-1]).idxmax() if (~above).any() else above.index[0]
    days = (daily.index[-1] - last_below_idx).days if hasattr(daily.index[-1], "to_pydatetime") else 0
    return int(min(max(days, 0), 90))


def _score_to_stage(score: float) -> str:
    if score < 3: return "discovery"
    if score < 5: return "early_adoption"
    if score < 7: return "approaching_tipping"
    if score < 8.5: return "tipping_point"
    return "mainstream"


def _tps_at(slug: str, snapshot: pd.Timestamp) -> float:
    g = hist_gtrends[(hist_gtrends["slug"] == slug) & (hist_gtrends["date"] <= snapshot)] \
        .sort_values("date").set_index("date")["interest"]
    w = hist_wiki[(hist_wiki["slug"] == slug) & (hist_wiki["date"] <= snapshot)] \
        .sort_values("date").set_index("date")["views"]
    d = hist_gdelt[(hist_gdelt["slug"] == slug) & (hist_gdelt["date"] <= snapshot)] \
        .sort_values("date").set_index("date")

    google_velocity = _pct_change_7d(g)
    wiki_growth = _pct_change_7d(w)
    gdelt_vol_growth = _pct_change_7d(d["volume"]) if not d.empty else 0.0
    gdelt_tone_mean = _mean_last(d["tone"], 14) if not d.empty else 0.0
    gdelt_vol_mean = _mean_last(d["volume"], 14) if not d.empty else 0.0
    days_in_stage = _days_in_current_stage(g)

    sentiment = max(min(gdelt_tone_mean / 10.0, 1.0), -1.0)
    comment_density = min(gdelt_vol_mean * 10.0, 50.0)

    gv = min(max(google_velocity / 100.0, 0.0), 2.0) / 2.0
    pg = min(gdelt_vol_growth / 100.0, 1.0) if gdelt_vol_growth > 0 else 0.0
    sn = (sentiment + 1.0) / 2.0
    cd = min(comment_density / 50.0, 1.0)
    discourse = pg * DISCOURSE_INNER["post_growth"] + sn * DISCOURSE_INNER["sentiment"] + cd * DISCOURSE_INNER["comment_density"]
    speed = max(1.0 - (days_in_stage / 30.0), 0.0)
    sm = speed * 0.7
    spiking = (1 if google_velocity > SPIKING["google_velocity"] else 0) \
        + (1 if gdelt_vol_growth > SPIKING["video_growth"] else 0) \
        + (1 if wiki_growth > SPIKING["wiki_growth"] else 0)
    cp = spiking / 3.0
    raw = (gv * WEIGHTS["google_velocity"] + discourse * WEIGHTS["discourse"]
           + sm * WEIGHTS["stage_momentum"] + cp * WEIGHTS["cross_platform"]) * 10
    return round(min(max(raw, 0.0), 10.0), 2)


def _wilson95(succ: int, total: int) -> dict:
    if total == 0: return {"lower": 0.0, "upper": 0.0}
    z, p, n = 1.96, succ / total, total
    z2 = z * z
    denom = 1 + z2 / n
    center = (p + z2 / (2 * n)) / denom
    margin = z * math.sqrt((p * (1 - p) + z2 / (4 * n)) / n) / denom
    return {"lower": max(0.0, center - margin), "upper": min(1.0, center + margin)}


eval_df = trends_df[trends_df["actual_outcome"].isin(["mainstream", "fizzled"])].merge(gtrends_peaks, on="slug", how="left").dropna(subset=["peak_date"])
result_rows: list[dict] = []
sig_rows: list[dict] = []

for _, t in eval_df.iterrows():
    slug, name, cat, outcome = t["slug"], t["name"], t["category"], t["actual_outcome"]
    peak = pd.Timestamp(t["peak_date"]).normalize()
    snapshots = [(w, peak + timedelta(weeks=w)) for w in SNAPSHOT_WEEKS]
    tps_series = [(w, snap, _tps_at(slug, snap)) for w, snap in snapshots]
    pred_tps = next((tps for w, _, tps in tps_series if w == -LEAD_WEEKS), 0.0)
    pred_stage = _score_to_stage(pred_tps)
    predicted_positive = pred_stage in POSITIVE_STAGES or pred_tps >= TPS_POSITIVE_THRESHOLD
    actual_positive = outcome == "mainstream"
    was_correct = predicted_positive == actual_positive

    weeks_before = None
    if actual_positive and was_correct:
        crossings = [-w for w, _, tps in tps_series if w <= 0 and tps >= TPS_POSITIVE_THRESHOLD]
        if crossings:
            weeks_before = max(crossings)

    result_rows.append({
        "slug": slug, "name": name, "category": cat, "peak_date": peak,
        "predicted_score": pred_tps, "predicted_stage": pred_stage,
        "actual_outcome": outcome, "was_correct": was_correct,
        "weeks_before_peak": weeks_before,
    })
    for w, snap, tps in tps_series:
        gi = hist_gtrends[(hist_gtrends["slug"] == slug) & (hist_gtrends["date"] <= snap)]["interest"]
        sig_rows.append({"slug": slug, "snapshot_date": snap, "weeks_from_peak": w,
                         "tps": tps, "google_interest": float(gi.tail(7).mean()) if len(gi) else 0.0})


backtest_results = pd.DataFrame(result_rows)
all_snapshots = pd.DataFrame(sig_rows)

correct_mainstream = backtest_results[(backtest_results["actual_outcome"] == "mainstream") & backtest_results["was_correct"] & backtest_results["weeks_before_peak"].notna()]
sig_slug = correct_mainstream.sort_values("weeks_before_peak", ascending=False).iloc[0]["slug"] if len(correct_mainstream) else (backtest_results.iloc[0]["slug"] if len(backtest_results) else None)
signature_timeline = all_snapshots[all_snapshots["slug"] == sig_slug].sort_values("snapshot_date").reset_index(drop=True) if sig_slug else pd.DataFrame()

n_total = len(backtest_results)
n_correct = int(backtest_results["was_correct"].sum())
acc = n_correct / n_total if n_total else 0.0
ci = _wilson95(n_correct, n_total)
weeks_vals = sorted([w for w in backtest_results["weeks_before_peak"].dropna().tolist()])
def _pct(p): return weeks_vals[min(len(weeks_vals) - 1, max(0, math.ceil(p / 100 * len(weeks_vals)) - 1))] if weeks_vals else 0
backtest_weeks_dist = {"min": weeks_vals[0] if weeks_vals else 0, "p50": _pct(50), "p90": _pct(90), "max": weeks_vals[-1] if weeks_vals else 0}

tp = int(((backtest_results["actual_outcome"] == "mainstream") & ((backtest_results["predicted_stage"].isin(POSITIVE_STAGES)) | (backtest_results["predicted_score"] >= TPS_POSITIVE_THRESHOLD))).sum())
fp = int(((backtest_results["actual_outcome"] != "mainstream") & ((backtest_results["predicted_stage"].isin(POSITIVE_STAGES)) | (backtest_results["predicted_score"] >= TPS_POSITIVE_THRESHOLD))).sum())
fn = int(((backtest_results["actual_outcome"] == "mainstream") & ~((backtest_results["predicted_stage"].isin(POSITIVE_STAGES)) | (backtest_results["predicted_score"] >= TPS_POSITIVE_THRESHOLD))).sum())
tn = int(((backtest_results["actual_outcome"] != "mainstream") & ~((backtest_results["predicted_stage"].isin(POSITIVE_STAGES)) | (backtest_results["predicted_score"] >= TPS_POSITIVE_THRESHOLD))).sum())
precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
backtest_outcome_metrics = {"precision": round(precision, 3), "recall": round(recall, 3), "f1": round(f1, 3),
                            "confusion_matrix": {"true_positive": tp, "false_positive": fp, "false_negative": fn, "true_negative": tn}}

cat_groups = backtest_results.groupby("category").agg(total=("was_correct", "size"), correct=("was_correct", "sum")).reset_index()
cat_groups["accuracy"] = (cat_groups["correct"] / cat_groups["total"]).round(3)
backtest_accuracy = {
    "overall_accuracy": round(acc, 3),
    "ci95": {"lower": round(ci["lower"], 3), "upper": round(ci["upper"], 3)},
    "total_trends": int(len(trends_df)), "evaluated_trends": n_total, "correct_predictions": n_correct,
    "avg_weeks_before_peak": round(float(np.mean(weeks_vals)), 1) if weeks_vals else 0.0,
    "category_accuracy": cat_groups.to_dict(orient="records"),
}

print(f"Accuracy: {acc:.3f} (95% CI {ci['lower']:.3f}..{ci['upper']:.3f}) on {n_total} trends")
print(f"Precision/Recall/F1: {precision:.3f} / {recall:.3f} / {f1:.3f}")
print(f"Weeks-before-peak: p50={backtest_weeks_dist['p50']} p90={backtest_weeks_dist['p90']}")
print(f"Signature trend: {sig_slug}")
