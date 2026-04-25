"""
Zerve block: classify_discourse
Type: Python
Depends on: load_trends, fetch_youtube
Required packages (Environment > Requirements > Python):
    transformers>=4.40, torch
Outputs:
    discourse_per_trend : DataFrame (slug, discourse_stage, stage_confidence,
                                     n_comments_classified)
    discourse_per_comment : DataFrame (slug, video_id, comment_id, label, confidence)

This block is a faithful port of `services/nlp/classifier.py`.
The candidate labels and LABEL_TO_STAGE map are byte-identical with the
original NestJS-backed NLP service so backtest results stay comparable.

If the Zerve runtime can't load `facebook/bart-large-mnli` (memory limits
on a free instance, etc.), see the note at the bottom of this file for the
LLM-backed fallback recipe.
"""
import pandas as pd
from transformers import pipeline

from zerve import variable

trends_df = variable("load_trends", "trends_df")
youtube_comments = variable("fetch_youtube", "youtube_comments")

CANDIDATE_LABELS = [
    "discovering a new trend for the first time",
    "learning how to participate in a trend",
    "trend is becoming widely known",
    "trend is everywhere and mainstream",
    "trend is declining and outdated",
]

LABEL_TO_STAGE = {
    "discovering a new trend for the first time": "discovery",
    "learning how to participate in a trend": "early_adoption",
    "trend is becoming widely known": "tipping_point",
    "trend is everywhere and mainstream": "mainstream",
    "trend is declining and outdated": "saturation",
}

MODEL_NAME = "facebook/bart-large-mnli"
MAX_COMMENTS_PER_TREND = 60
MAX_CHARS = 512
BATCH_SIZE = 16

zero_shot = pipeline("zero-shot-classification", model=MODEL_NAME, device=-1)


def _prep(text: str) -> str:
    return (text or "").strip()[:MAX_CHARS]


def _classify_trend(slug: str, comments: pd.DataFrame) -> tuple[dict, list[dict]]:
    if comments.empty:
        return {
            "slug": slug,
            "discourse_stage": "discovery",
            "stage_confidence": 0.5,
            "n_comments_classified": 0,
        }, []

    texts = [_prep(t) for t in comments["text"].tolist()[:MAX_COMMENTS_PER_TREND]]
    texts = [t for t in texts if t]
    if not texts:
        return {
            "slug": slug,
            "discourse_stage": "discovery",
            "stage_confidence": 0.5,
            "n_comments_classified": 0,
        }, []

    results = zero_shot(texts, CANDIDATE_LABELS, multi_label=False, batch_size=BATCH_SIZE)
    if isinstance(results, dict):
        results = [results]

    stage_votes: dict[str, float] = {s: 0.0 for s in LABEL_TO_STAGE.values()}
    rows: list[dict] = []
    for (_, c), r in zip(
        comments[: len(texts)].reset_index(drop=True).iterrows(), results
    ):
        top_label = r["labels"][0]
        conf = float(r["scores"][0])
        stage = LABEL_TO_STAGE[top_label]
        stage_votes[stage] += conf
        rows.append(
            {
                "slug": slug,
                "video_id": c["video_id"],
                "comment_id": c["comment_id"],
                "label": stage,
                "confidence": round(conf, 3),
            }
        )

    total = sum(stage_votes.values())
    dominant = max(stage_votes, key=stage_votes.get)
    confidence = stage_votes[dominant] / total if total > 0 else 0.5
    return (
        {
            "slug": slug,
            "discourse_stage": dominant,
            "stage_confidence": round(confidence, 3),
            "n_comments_classified": len(texts),
        },
        rows,
    )


per_trend_rows: list[dict] = []
per_comment_rows: list[dict] = []

for _, t in trends_df.iterrows():
    slug = t["slug"]
    print(f"[discourse] {slug}")
    if youtube_comments.empty:
        slug_comments = youtube_comments
    else:
        slug_comments = youtube_comments[youtube_comments["slug"] == slug]
    summary, rows = _classify_trend(slug, slug_comments)
    per_trend_rows.append(summary)
    per_comment_rows.extend(rows)

discourse_per_trend = pd.DataFrame(per_trend_rows)
discourse_per_comment = (
    pd.DataFrame(per_comment_rows)
    if per_comment_rows
    else pd.DataFrame(columns=["slug", "video_id", "comment_id", "label", "confidence"])
)

print(
    f"Classified {len(discourse_per_comment)} comments across "
    f"{discourse_per_trend['n_comments_classified'].astype(bool).sum()} trends"
)
print(discourse_per_trend["discourse_stage"].value_counts().to_dict())

# Fallback note ---------------------------------------------------------------
# If `facebook/bart-large-mnli` fails to load on the Zerve runtime, replace the
# call to `pipeline(...)` and `_classify_trend(...)` with an LLM call that
# returns one of the five LABEL_TO_STAGE keys per comment. The labels are the
# IP, not the model. Use Zerve's GenAI block or a direct OpenAI/Anthropic call.
