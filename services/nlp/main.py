import os
import logging
import asyncio
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from classifier import DiscourseClassifier
from reddit_fetcher import RedditFetcher
from trends_fetcher import TrendsFetcher
import httpx

logger = logging.getLogger("nlp-service")

if not logger.handlers:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

app = FastAPI(title="TrendSeismograph NLP Service", version="1.0.0")

NLP_SERVICE_SECRET = os.environ.get("NLP_SERVICE_SECRET", "")
WIKIPEDIA_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
WIKIPEDIA_LIMITS = httpx.Limits(max_keepalive_connections=20, max_connections=50)
WIKIPEDIA_BASE = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"
CLASSIFY_CONCURRENCY = int(os.environ.get("CLASSIFY_MAX_CONCURRENCY", "4"))
CLASSIFY_SEMAPHORE = asyncio.Semaphore(max(1, CLASSIFY_CONCURRENCY))
wikipedia_client: httpx.AsyncClient | None = None


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
    title: str = Field(..., min_length=1, max_length=300)
    body: Optional[str] = Field(default="", max_length=2000)


class ClassifyRequest(BaseModel):
    trend_slug: str = Field(..., min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    posts: List[Post]


@app.on_event("startup")
async def startup_event():
    global wikipedia_client
    wikipedia_client = httpx.AsyncClient(timeout=WIKIPEDIA_TIMEOUT, limits=WIKIPEDIA_LIMITS)
    logger.info("NLP service started")


@app.on_event("shutdown")
async def shutdown_event():
    global wikipedia_client
    if wikipedia_client is not None:
        await wikipedia_client.aclose()
        wikipedia_client = None
    logger.info("NLP service stopped")


@app.get("/health")
async def health():
    return {
        "status": "ok" if classifier.is_loaded else "degraded",
        "model_loaded": classifier.is_loaded,
        "classify_max_concurrency": max(1, CLASSIFY_CONCURRENCY),
    }


@app.post("/classify")
async def classify_discourse(req: ClassifyRequest):
    """Classify Reddit posts into discourse stages using zero-shot classification."""
    try:
        async with CLASSIFY_SEMAPHORE:
            return await run_in_threadpool(classifier.classify, req.trend_slug, req.posts)
    except Exception:
        logger.exception("Classification failed for %s", req.trend_slug)
        raise HTTPException(status_code=503, detail="Classification service temporarily unavailable")


@app.get("/reddit/{slug}")
async def fetch_reddit(slug: str):
    """Fetch Reddit posts and metadata for a trend slug."""
    try:
        return await run_in_threadpool(reddit.fetch, slug)
    except Exception:
        logger.exception("Reddit fetch failed for %s", slug)
        raise HTTPException(status_code=502, detail="Reddit data fetch failed")


@app.get("/trends/{slug}")
async def fetch_google_trends(slug: str):
    """Fetch Google Trends data for a trend slug."""
    try:
        return await run_in_threadpool(trends.fetch, slug)
    except Exception:
        logger.exception("Google Trends fetch failed for %s", slug)
        raise HTTPException(status_code=502, detail="Google Trends data fetch failed")


@app.get("/wikipedia/{slug}")
async def fetch_wikipedia(slug: str):
    """Fetch Wikipedia pageview data for a trend slug."""
    if wikipedia_client is None:
        raise HTTPException(status_code=503, detail="Wikipedia client unavailable")

    article = slug.replace("-", "_").title()
    today = date.today()
    start = (today - timedelta(days=90)).strftime("%Y%m%d")
    end = today.strftime("%Y%m%d")
    url = f"{WIKIPEDIA_BASE}/en.wikipedia/all-access/all-agents/{article}/daily/{start}/{end}"

    try:
        response = None
        for attempt in range(3):
            try:
                response = await wikipedia_client.get(url)
                response.raise_for_status()
                break
            except httpx.HTTPError:
                if attempt == 2:
                    raise
                await asyncio.sleep(0.25 * (2 ** attempt))

        data = response.json() if response is not None else {}
        items = data.get("items", [])
        if not items:
            return {"pageviews": 0, "growth_rate": 0}

        latest = items[-1].get("views", 0)
        prev = items[-8].get("views", latest) if len(items) >= 8 else latest
        growth = ((latest - prev) / max(prev, 1)) * 100
        return {"pageviews": latest, "growth_rate": round(growth, 2)}
    except Exception:
        logger.exception("Wikipedia fetch failed for %s", slug)
        return {"pageviews": 0, "growth_rate": 0, "error": "Wikipedia data fetch failed"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
