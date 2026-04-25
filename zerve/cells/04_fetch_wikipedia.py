"""
Zerve block: fetch_wikipedia
Type: Python
Depends on: load_trends
Outputs:
    wiki_articles  : DataFrame (slug, article, resolved_via)
        article is the URL-encoded title used by the pageviews API,
        or None if no Wikipedia match was found.
    wiki_pageviews : DataFrame (slug, article, date, views)
        Daily pageviews on en.wikipedia for the resolved article over
        the configured lookback window.

Two-step lookup: opensearch resolves a free-text trend name to its best
matching article title, then the pageviews REST API returns daily counts.
No auth required; only a User-Agent header is mandatory per Wikimedia ToS.
"""
import time
from datetime import datetime, timedelta

import pandas as pd
import requests

from zerve import variable

trends_df = variable("load_trends", "trends_df")

LOOKBACK_DAYS = 90
USER_AGENT = "trendseismograph/1.0 (zervehack 2026; contact via project)"
SEARCH_URL = "https://en.wikipedia.org/w/api.php"
PAGEVIEWS_URL = (
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
    "en.wikipedia/all-access/all-agents/{article}/daily/{start}/{end}"
)
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_CALLS = 0.4

HEADERS = {"User-Agent": USER_AGENT, "Accept": "application/json"}


def _resolve_article(name: str) -> str | None:
    r = requests.get(
        SEARCH_URL,
        timeout=REQUEST_TIMEOUT,
        headers=HEADERS,
        params={
            "action": "opensearch",
            "search": name,
            "limit": 1,
            "namespace": 0,
            "format": "json",
        },
    )
    if r.status_code != 200:
        return None
    data = r.json()
    if isinstance(data, list) and len(data) >= 2 and data[1]:
        return data[1][0].replace(" ", "_")
    return None


def _fetch_pageviews(article: str, start: str, end: str) -> pd.DataFrame:
    url = PAGEVIEWS_URL.format(
        article=requests.utils.quote(article, safe=""),
        start=start,
        end=end,
    )
    r = requests.get(url, timeout=REQUEST_TIMEOUT, headers=HEADERS)
    if r.status_code in (404, 400):
        return pd.DataFrame(columns=["date", "views"])
    r.raise_for_status()
    items = r.json().get("items", [])
    return pd.DataFrame(
        [
            {
                "date": pd.to_datetime(it["timestamp"][:8], format="%Y%m%d"),
                "views": int(it["views"]),
            }
            for it in items
        ]
    )


end_dt = datetime.utcnow().date()
start_dt = end_dt - timedelta(days=LOOKBACK_DAYS)
start_s, end_s = start_dt.strftime("%Y%m%d"), end_dt.strftime("%Y%m%d")

article_rows: list[dict] = []
view_frames: list[pd.DataFrame] = []

for _, row in trends_df.iterrows():
    slug, name = row["slug"], row["name"]
    print(f"[wiki] {slug} ({name})")

    article = _resolve_article(name)
    if not article:
        article_rows.append({"slug": slug, "article": None, "resolved_via": "unresolved"})
        time.sleep(SLEEP_BETWEEN_CALLS)
        continue

    article_rows.append({"slug": slug, "article": article, "resolved_via": "opensearch"})

    pv = _fetch_pageviews(article, start_s, end_s)
    if not pv.empty:
        pv = pv.assign(slug=slug, article=article)
        view_frames.append(pv)
    time.sleep(SLEEP_BETWEEN_CALLS)


wiki_articles = pd.DataFrame(article_rows)
wiki_pageviews = (
    pd.concat(view_frames, ignore_index=True)
    if view_frames
    else pd.DataFrame(columns=["slug", "article", "date", "views"])
)

resolved = wiki_articles["article"].notna().sum()
print(f"Resolved {resolved}/{len(wiki_articles)} articles. Pageview rows: {len(wiki_pageviews)}")
