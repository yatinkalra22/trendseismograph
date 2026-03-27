from transformers import pipeline
from typing import List
import numpy as np

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
        print("Loading facebook/bart-large-mnli...")
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
        print("Models loaded successfully.")

    def classify(self, trend_slug: str, posts: list) -> dict:
        if not posts:
            return {
                "discourse_stage": "discovery",
                "stage_confidence": 0.5,
                "sentiment_score": 0.0,
                "labeled_posts": [],
            }

        labeled_posts = []
        stage_votes = {stage: 0.0 for stage in LABEL_TO_STAGE.values()}
        sentiment_scores = []

        for post in posts[:20]:
            text = f"{post.title} {post.body or ''}"[:512]

            result = self.zero_shot(text, CANDIDATE_LABELS, multi_label=False)
            top_label = result["labels"][0]
            confidence = result["scores"][0]
            stage = LABEL_TO_STAGE[top_label]

            stage_votes[stage] += confidence

            sent = self.sentiment(text[:512])[0]
            sent_score = sent["score"] if sent["label"] == "POSITIVE" else -sent["score"]
            sentiment_scores.append(sent_score)

            labeled_posts.append(
                {"title": post.title, "label": stage, "confidence": round(confidence, 3)}
            )

        dominant_stage = max(stage_votes, key=stage_votes.get)
        total_votes = sum(stage_votes.values())
        stage_confidence = (
            stage_votes[dominant_stage] / total_votes if total_votes > 0 else 0.5
        )

        avg_sentiment = float(np.mean(sentiment_scores)) if sentiment_scores else 0.0

        return {
            "discourse_stage": dominant_stage,
            "stage_confidence": round(stage_confidence, 3),
            "sentiment_score": round(avg_sentiment, 3),
            "labeled_posts": labeled_posts,
        }
