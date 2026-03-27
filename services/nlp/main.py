import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from classifier import DiscourseClassifier
from reddit_fetcher import RedditFetcher
from trends_fetcher import TrendsFetcher
import httpx

logger = logging.getLogger("nlp-service")

app = FastAPI(title="TrendSeismograph NLP Service", version="1.0.0")

NLP_SERVICE_SECRET = os.environ.get("NLP_SERVICE_SECRET", "")


@app.middleware("http")
async def verify_service_key(request: Request, call_next):
    """Require X-Service-Key header on all endpoints except /health."""
    if request.url.path == "/health":
        return await call_next(request)
    if NLP_SERVICE_SECRET:
        key = request.headers.get("X-Service-Key", "")
        if key != NLP_SERVICE_SECRET:
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)


# Load models at startup
classifier = DiscourseClassifier()
reddit = RedditFetcher()
trends = TrendsFetcher()


class Post(BaseModel):
    title: str
    body: Optional[str] = ""


class ClassifyRequest(BaseModel):
    trend_slug: str
    posts: List[Post]


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": classifier.is_loaded}


@app.post("/classify")
async def classify_discourse(req: ClassifyRequest):
    """Classify Reddit posts into discourse stages using zero-shot classification."""
    return classifier.classify(req.trend_slug, req.posts)


@app.get("/reddit/{slug}")
async def fetch_reddit(slug: str):
    """Fetch Reddit posts and metadata for a trend slug."""
    try:
        return reddit.fetch(slug)
    except Exception as e:
        logger.exception("Reddit fetch failed for %s", slug)
        raise HTTPException(status_code=500, detail="Reddit data fetch failed")


@app.get("/trends/{slug}")
async def fetch_google_trends(slug: str):
    """Fetch Google Trends data for a trend slug."""
    try:
        return trends.fetch(slug)
    except Exception as e:
        logger.exception("Google Trends fetch failed for %s", slug)
        raise HTTPException(status_code=500, detail="Google Trends data fetch failed")


@app.get("/wikipedia/{slug}")
async def fetch_wikipedia(slug: str):
    """Fetch Wikipedia pageview data for a trend slug."""
    try:
        article = slug.replace("-", "_").title()
        today = __import__("datetime").date.today()
        start = (today - __import__("datetime").timedelta(days=90)).strftime("%Y%m%d")
        end = today.strftime("%Y%m%d")
        url = f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/{article}/daily/{start}/{end}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10)
            data = response.json()
            items = data.get("items", [])
            if not items:
                return {"pageviews": 0, "growth_rate": 0}
            latest = items[-1]["views"]
            prev = items[-8]["views"] if len(items) >= 8 else latest
            growth = ((latest - prev) / max(prev, 1)) * 100
            return {"pageviews": latest, "growth_rate": round(growth, 2)}
    except Exception as e:
        logger.exception("Wikipedia fetch failed for %s", slug)
        return {"pageviews": 0, "growth_rate": 0, "error": "Wikipedia data fetch failed"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
