from pytrends.request import TrendReq
import logging
from threading import Lock

logger = logging.getLogger("nlp-service")


class TrendsFetcher:
    def __init__(self):
        self.pytrends = TrendReq(hl="en-US", tz=360)
        self._lock = Lock()

    def fetch(self, slug: str) -> dict:
        keyword = slug.replace("-", " ")
        try:
            # pytrends keeps mutable internal state; serialize payload usage.
            with self._lock:
                self.pytrends.build_payload(
                    [keyword], cat=0, timeframe="today 3-m", geo="", gprop=""
                )
                interest_df = self.pytrends.interest_over_time()

            if interest_df.empty or keyword not in interest_df.columns:
                return {"current_value": 0, "velocity": 0, "history": []}

            values = interest_df[keyword].tolist()
            current = values[-1] if values else 0
            prev_week = values[-8] if len(values) >= 8 else current

            velocity = ((current - prev_week) / max(prev_week, 1)) * 100

            return {
                "current_value": int(current),
                "velocity": round(velocity, 2),
                "history": values[-30:],
            }
        except Exception:
            logger.exception("Google Trends error for %s", slug)
            return {
                "current_value": 0,
                "velocity": 0,
                "history": [],
                "error": "Google Trends data fetch failed",
            }
