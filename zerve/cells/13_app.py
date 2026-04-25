"""
Zerve block: app
Type: Streamlit App (Zerve > Deploy > Create App)
Depends on: load_trends, compute_tps, score_api, backtest
Required packages (Environment > Requirements > Python):
    streamlit, pandas, altair

Minimal interactive view for the demo:
    1. Pick a trend from the seed universe.
    2. See its TPS, stage, the four sub-scores, and the headline signals.
    3. See sparklines for Google interest and Wikipedia views.
    4. See the leaderboard (top 10 trends ranked by TPS).
    5. See the backtest headline (accuracy, 95% CI, median weeks-before-peak).

Publish via Deploy > Create App. The hosted URL is the second deliverable
that earns the deployment bonus called out in the judging criteria.
"""
import altair as alt
import pandas as pd
import streamlit as st

from zerve import variable

trends_df = variable("load_trends", "trends_df")
scored_trends = variable("compute_tps", "scored_trends")
backtest_accuracy = variable("backtest", "backtest_accuracy")
backtest_outcome_metrics = variable("backtest", "backtest_outcome_metrics")
backtest_weeks_dist = variable("backtest", "backtest_weeks_dist")
score = variable("score_api", "score")

st.set_page_config(page_title="TrendSeismograph", layout="wide")
st.title("TrendSeismograph")
st.caption("Cultural tipping point detection — Google Trends + YouTube discourse + Wikipedia + GDELT.")

# --- Backtest headline -------------------------------------------------------
acc = backtest_accuracy.get("overall_accuracy", 0.0)
ci = backtest_accuracy.get("ci95", {"lower": 0.0, "upper": 0.0})
weeks = backtest_weeks_dist or {"p50": 0, "p90": 0}
f1 = backtest_outcome_metrics.get("f1", 0.0)

c1, c2, c3, c4 = st.columns(4)
c1.metric("Backtest accuracy", f"{acc:.0%}", help=f"95% CI [{ci['lower']:.2f}, {ci['upper']:.2f}]")
c2.metric("F1 (mainstream)", f"{f1:.2f}")
c3.metric("Median weeks before peak", f"{weeks.get('p50', 0)}")
c4.metric("Trends evaluated", backtest_accuracy.get("evaluated_trends", 0))
st.divider()

# --- Trend selector ----------------------------------------------------------
left, right = st.columns([1, 2])
with left:
    st.subheader("Score a trend")
    options = scored_trends["slug"].tolist() if len(scored_trends) else trends_df["slug"].tolist()
    slug = st.selectbox("Trend", options, index=0 if options else None)

if not slug:
    st.stop()

result = score(slug)
if "error" in result:
    st.error(result["error"])
    st.stop()

# --- Headline TPS card -------------------------------------------------------
with right:
    tps = result["tipping_point_score"]
    stage = result["discourse_stage"].replace("_", " ").title()
    st.subheader(result["name"])
    st.caption(f"{result['category']} · stage: **{stage}** · confidence {result['stage_confidence']:.2f}")
    st.progress(min(tps / 10.0, 1.0), text=f"Tipping Point Score: {tps:.2f} / 10")

# --- Sub-scores --------------------------------------------------------------
st.subheader("Score breakdown")
sub = result["sub_scores"]
weights = result["weights"]
sub_df = pd.DataFrame([
    {"component": "Google velocity",   "weight": weights["google_velocity"],   "sub_score": sub["google_velocity"]},
    {"component": "Discourse",         "weight": weights["discourse"],         "sub_score": sub["discourse"]},
    {"component": "Stage momentum",    "weight": weights["stage_momentum"],    "sub_score": sub["stage_momentum"]},
    {"component": "Cross-platform",    "weight": weights["cross_platform"],    "sub_score": sub["cross_platform"]},
])
sub_df["contribution"] = (sub_df["weight"] * sub_df["sub_score"] * 10).round(2)
chart = alt.Chart(sub_df).mark_bar().encode(
    x=alt.X("contribution:Q", title="contribution to TPS"),
    y=alt.Y("component:N", sort="-x"),
    tooltip=["component", "weight", "sub_score", "contribution"],
)
st.altair_chart(chart, use_container_width=True)

# --- Raw signals -------------------------------------------------------------
st.subheader("Signals")
sig = result["signals"]
s1, s2, s3, s4 = st.columns(4)
s1.metric("Google velocity (Δ7d)", f"{sig['google_velocity_pct']:+.1f}%")
s2.metric("YouTube upload growth", f"{sig['video_upload_growth_pct']:+.1f}%")
s3.metric("Wikipedia growth", f"{sig['wiki_growth_pct']:+.1f}%")
s4.metric("Sentiment", f"{sig['sentiment']:+.2f}")
s5, s6, s7, s8 = st.columns(4)
s5.metric("Comments / video", f"{sig['comment_density']:.1f}")
s6.metric("Days in stage", f"{sig['days_in_current_stage']}")
s7.metric("Videos sampled", f"{sig['n_videos_sampled']}")
s8.metric("Comments classified", f"{sig['n_comments_classified']}")

# --- Sparklines --------------------------------------------------------------
st.subheader("Recent activity")
spark = result["sparklines"]
sp1, sp2 = st.columns(2)
with sp1:
    st.caption("Google interest (last 30 days)")
    if spark["google_interest"]:
        st.line_chart(pd.DataFrame(spark["google_interest"]).set_index("date")["value"])
    else:
        st.info("no data")
with sp2:
    st.caption("Wikipedia pageviews (last 30 days)")
    if spark["wikipedia_views"]:
        st.line_chart(pd.DataFrame(spark["wikipedia_views"]).set_index("date")["value"])
    else:
        st.info("no data")

# --- Leaderboard -------------------------------------------------------------
st.subheader("Leaderboard — top 10 by TPS")
leaderboard_cols = ["slug", "name", "category", "tipping_point_score", "discourse_stage"]
st.dataframe(
    scored_trends[leaderboard_cols].head(10).rename(columns={"tipping_point_score": "TPS"}),
    use_container_width=True, hide_index=True,
)

st.caption(
    "TPS = 0.30·google_velocity + 0.25·discourse + 0.25·stage_momentum + 0.20·cross_platform · 10. "
    "Backtest discourse term substitutes GDELT vol/tone for YouTube comments (unreconstructable historically)."
)
