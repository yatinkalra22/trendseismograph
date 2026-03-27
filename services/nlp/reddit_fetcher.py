import logging
import praw
import os

logger = logging.getLogger("nlp-service")


class RedditFetcher:
    def __init__(self):
        client_id = os.environ.get("REDDIT_CLIENT_ID", "")
        client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
        user_agent = os.environ.get("REDDIT_USER_AGENT", "TrendSeismograph/1.0")

        if client_id and client_secret:
            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent,
            )
        else:
            self.reddit = None

    def fetch(self, slug: str) -> dict:
        """Search Reddit for posts about this trend."""
        posts = []

        if not self.reddit:
            return {
                "posts": [],
                "post_count": 0,
                "comment_density": 0,
                "growth_rate": 0,
                "error": "Reddit credentials not configured",
            }

        try:
            results = self.reddit.subreddit("all").search(
                slug.replace("-", " "), sort="new", time_filter="month", limit=25
            )
            for post in results:
                posts.append(
                    {
                        "title": post.title,
                        "body": post.selftext[:500],
                        "score": post.score,
                        "num_comments": post.num_comments,
                        "subreddit": str(post.subreddit),
                        "created_utc": post.created_utc,
                    }
                )
        except Exception as e:
            logger.exception("Reddit fetch error for %s", slug)

        post_count = len(posts)
        avg_comments = sum(p["num_comments"] for p in posts) / max(post_count, 1)
        growth_rate = self._compute_growth_rate(posts)

        return {
            "posts": posts,
            "post_count": post_count,
            "comment_density": round(avg_comments, 2),
            "growth_rate": round(growth_rate, 2),
        }

    @staticmethod
    def _compute_growth_rate(posts: list) -> float:
        """Compare engagement in the newer half vs older half of posts."""
        if len(posts) < 4:
            return 0.0
        sorted_posts = sorted(posts, key=lambda p: p.get("created_utc", 0))
        mid = len(sorted_posts) // 2
        older = sorted_posts[:mid]
        newer = sorted_posts[mid:]
        older_avg = sum(p["score"] + p["num_comments"] for p in older) / len(older)
        newer_avg = sum(p["score"] + p["num_comments"] for p in newer) / len(newer)
        if older_avg == 0:
            return 0.0
        return ((newer_avg - older_avg) / older_avg) * 100
