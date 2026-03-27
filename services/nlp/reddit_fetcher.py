import praw
import os


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
                "days_in_stage": 7,
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
                    }
                )
        except Exception as e:
            print(f"Reddit fetch error for {slug}: {e}")

        post_count = len(posts)
        avg_comments = sum(p["num_comments"] for p in posts) / max(post_count, 1)

        return {
            "posts": posts,
            "post_count": post_count,
            "comment_density": round(avg_comments, 2),
            "growth_rate": 15.0,
            "days_in_stage": 7,
        }
