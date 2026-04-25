"""
Zerve block: score_sentiment
Type: Python
Depends on: load_trends, fetch_youtube
Required packages (Environment > Requirements > Python):
    transformers>=4.40, torch
Outputs:
    sentiment_per_trend   : DataFrame (slug, sentiment_score, n_comments_scored)
        sentiment_score is the mean of per-comment scores in [-1, +1],
        signed by POSITIVE/NEGATIVE label, matching `services/nlp/classifier.py`.
    sentiment_per_comment : DataFrame (slug, video_id, comment_id, label, score)

Direct port of the sentiment branch from the original NLP service so the
0.30 sentiment weight inside the discourse term stays comparable.
"""
import pandas as pd
from transformers import pipeline

from zerve import variable

trends_df = variable("load_trends", "trends_df")
youtube_comments = variable("fetch_youtube", "youtube_comments")

MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"
MAX_COMMENTS_PER_TREND = 60
MAX_CHARS = 512
BATCH_SIZE = 32

sentiment = pipeline("sentiment-analysis", model=MODEL_NAME, device=-1)


def _prep(text: str) -> str:
    return (text or "").strip()[:MAX_CHARS]


def _score_trend(slug: str, comments: pd.DataFrame) -> tuple[dict, list[dict]]:
    if comments.empty:
        return {"slug": slug, "sentiment_score": 0.0, "n_comments_scored": 0}, []

    texts = [_prep(t) for t in comments["text"].tolist()[:MAX_COMMENTS_PER_TREND]]
    texts = [t for t in texts if t]
    if not texts:
        return {"slug": slug, "sentiment_score": 0.0, "n_comments_scored": 0}, []

    results = sentiment(texts, batch_size=BATCH_SIZE, truncation=True)
    if isinstance(results, dict):
        results = [results]

    rows: list[dict] = []
    signed_scores: list[float] = []
    paired = comments[: len(texts)].reset_index(drop=True)
    for (_, c), r in zip(paired.iterrows(), results):
        label = r["label"]
        raw = float(r["score"])
        signed = raw if label == "POSITIVE" else -raw
        signed_scores.append(signed)
        rows.append(
            {
                "slug": slug,
                "video_id": c["video_id"],
                "comment_id": c["comment_id"],
                "label": label,
                "score": round(signed, 3),
            }
        )

    mean_score = sum(signed_scores) / len(signed_scores) if signed_scores else 0.0
    return (
        {
            "slug": slug,
            "sentiment_score": round(float(mean_score), 3),
            "n_comments_scored": len(texts),
        },
        rows,
    )


per_trend_rows: list[dict] = []
per_comment_rows: list[dict] = []

for _, t in trends_df.iterrows():
    slug = t["slug"]
    print(f"[sentiment] {slug}")
    if youtube_comments.empty:
        slug_comments = youtube_comments
    else:
        slug_comments = youtube_comments[youtube_comments["slug"] == slug]
    summary, rows = _score_trend(slug, slug_comments)
    per_trend_rows.append(summary)
    per_comment_rows.extend(rows)

sentiment_per_trend = pd.DataFrame(per_trend_rows)
sentiment_per_comment = (
    pd.DataFrame(per_comment_rows)
    if per_comment_rows
    else pd.DataFrame(columns=["slug", "video_id", "comment_id", "label", "score"])
)

print(
    f"Scored {len(sentiment_per_comment)} comments. "
    f"Mean trend sentiment: "
    f"{sentiment_per_trend['sentiment_score'].mean():.3f}"
)
