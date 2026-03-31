import logging
from statistics import mean
from typing import Any, Iterable
from transformers import pipeline

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


class DiscourseClassifier:
    def __init__(self):
        self.logger = logging.getLogger("nlp-service")
        self.zero_shot = None
        self.sentiment = None
        self.max_posts = 20
        self.max_chars = 512
        self.is_loaded = False

        try:
            self.logger.info("Loading NLP models...")
            self.zero_shot = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=-1,
            )
            self.sentiment = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1,
            )
            self.is_loaded = True
            self.logger.info("NLP models loaded successfully")
        except Exception:
            self.logger.exception("Failed to load NLP models")

    def _normalize_posts(self, posts: Iterable[Any]) -> list[dict[str, str]]:
        normalized = []
        for post in list(posts)[: self.max_posts]:
            title = getattr(post, "title", None)
            body = getattr(post, "body", None)

            if isinstance(post, dict):
                title = post.get("title", title)
                body = post.get("body", body)

            text = f"{title or ''} {body or ''}".strip()[: self.max_chars]
            if not text:
                continue

            normalized.append({"title": str(title or ""), "text": text})
        return normalized

    def classify(self, trend_slug: str, posts: list) -> dict:
        if not self.is_loaded or self.zero_shot is None or self.sentiment is None:
            raise RuntimeError("NLP models are not loaded")

        if not posts:
            return {
                "discourse_stage": "discovery",
                "stage_confidence": 0.5,
                "sentiment_score": 0.0,
                "labeled_posts": [],
            }

        normalized_posts = self._normalize_posts(posts)
        if not normalized_posts:
            return {
                "discourse_stage": "discovery",
                "stage_confidence": 0.5,
                "sentiment_score": 0.0,
                "labeled_posts": [],
            }

        labeled_posts = []
        stage_votes = {stage: 0.0 for stage in LABEL_TO_STAGE.values()}
        sentiment_scores = []

        texts = [post["text"] for post in normalized_posts]

        # Batch inference significantly reduces per-request overhead.
        z_results = self.zero_shot(texts, CANDIDATE_LABELS, multi_label=False)
        if isinstance(z_results, dict):
            z_results = [z_results]

        s_results = self.sentiment(texts)
        if isinstance(s_results, dict):
            s_results = [s_results]

        for idx, post in enumerate(normalized_posts):
            result = z_results[idx]
            top_label = result["labels"][0]
            confidence = result["scores"][0]
            stage = LABEL_TO_STAGE[top_label]

            stage_votes[stage] += confidence

            sent = s_results[idx]
            sent_score = sent["score"] if sent["label"] == "POSITIVE" else -sent["score"]
            sentiment_scores.append(sent_score)

            labeled_posts.append(
                {"title": post["title"], "label": stage, "confidence": round(confidence, 3)}
            )

        dominant_stage = max(stage_votes, key=stage_votes.get)
        total_votes = sum(stage_votes.values())
        stage_confidence = (
            stage_votes[dominant_stage] / total_votes if total_votes > 0 else 0.5
        )

        avg_sentiment = float(mean(sentiment_scores)) if sentiment_scores else 0.0

        return {
            "discourse_stage": dominant_stage,
            "stage_confidence": round(stage_confidence, 3),
            "sentiment_score": round(avg_sentiment, 3),
            "labeled_posts": labeled_posts,
        }
