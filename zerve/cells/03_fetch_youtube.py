"""
Zerve block: fetch_youtube
Type: Python
Depends on: load_trends
Required env var (Environment > Requirements > Environment Variables):
    YOUTUBE_API_KEY  (YouTube Data API v3, project must have the API enabled)
Outputs:
    youtube_videos     : DataFrame (slug, video_id, channel_id, published_at,
                                    title, description, view_count, like_count,
                                    comment_count)
    youtube_comments   : DataFrame (slug, video_id, comment_id, published_at,
                                    text, like_count)
    youtube_quota_used : dict {search_units, video_units, comment_units, total}

Quota math: 47 trends * (100 search + ~25 video stats batches at 1 +
~25 commentThreads at 1) ≈ ~5,900 units worst case. Daily quota is 10k.
The cell skips trends that 403 (quota exhausted) instead of crashing.
"""
import math
import os
import time
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests

from zerve import variable

trends_df = variable("load_trends", "trends_df")

API_KEY = os.environ["YOUTUBE_API_KEY"]
BASE_URL = "https://www.googleapis.com/youtube/v3"

LOOKBACK_DAYS = 90
VIDEOS_PER_TREND = 25
COMMENTS_PER_VIDEO = 20
REQUEST_TIMEOUT = 20
SLEEP_BETWEEN_CALLS = 0.2

COST_SEARCH = 100
COST_VIDEOS = 1
COST_COMMENTS = 1


def _get(path: str, params: dict) -> dict:
    r = requests.get(
        f"{BASE_URL}/{path}",
        params={**params, "key": API_KEY},
        timeout=REQUEST_TIMEOUT,
    )
    if r.status_code in (403, 429):
        print(f"  ! YouTube {r.status_code} on {path}: {r.text[:160]}")
        return {}
    r.raise_for_status()
    return r.json()


def _search_videos(query: str, published_after_iso: str) -> list[dict]:
    items: list[dict] = []
    page_token: str | None = None
    while len(items) < VIDEOS_PER_TREND:
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "order": "viewCount",
            "publishedAfter": published_after_iso,
            "maxResults": min(50, VIDEOS_PER_TREND - len(items)),
        }
        if page_token:
            params["pageToken"] = page_token
        data = _get("search", params)
        items.extend(data.get("items", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break
        time.sleep(SLEEP_BETWEEN_CALLS)
    return items[:VIDEOS_PER_TREND]


def _video_stats(video_ids: list[str]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i : i + 50]
        data = _get("videos", {"part": "statistics,snippet", "id": ",".join(chunk)})
        for it in data.get("items", []):
            out[it["id"]] = it
        time.sleep(SLEEP_BETWEEN_CALLS)
    return out


def _video_comments(video_id: str) -> list[dict]:
    data = _get(
        "commentThreads",
        {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": COMMENTS_PER_VIDEO,
            "order": "relevance",
            "textFormat": "plainText",
        },
    )
    return data.get("items", [])


published_after = (
    (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS))
    .isoformat(timespec="seconds")
    .replace("+00:00", "Z")
)

video_rows: list[dict] = []
comment_rows: list[dict] = []
n_search = n_video_calls = n_comment_calls = 0

for _, row in trends_df.iterrows():
    slug, name = row["slug"], row["name"]
    print(f"[yt] {slug} ({name})")

    search_items = _search_videos(name, published_after)
    n_search += max(1, math.ceil(len(search_items) / 50))
    if not search_items:
        continue

    vids = [s["id"]["videoId"] for s in search_items if "videoId" in s.get("id", {})]
    stats = _video_stats(vids)
    n_video_calls += max(1, math.ceil(len(vids) / 50))

    for vid in vids:
        v = stats.get(vid)
        if not v:
            continue
        sn, st = v.get("snippet", {}), v.get("statistics", {})
        video_rows.append(
            {
                "slug": slug,
                "video_id": vid,
                "channel_id": sn.get("channelId"),
                "published_at": sn.get("publishedAt"),
                "title": sn.get("title", ""),
                "description": sn.get("description", ""),
                "view_count": int(st.get("viewCount", 0)),
                "like_count": int(st.get("likeCount", 0)),
                "comment_count": int(st.get("commentCount", 0)),
            }
        )

        comments = _video_comments(vid)
        n_comment_calls += 1
        for c in comments:
            top = c["snippet"]["topLevelComment"]["snippet"]
            comment_rows.append(
                {
                    "slug": slug,
                    "video_id": vid,
                    "comment_id": c["id"],
                    "published_at": top.get("publishedAt"),
                    "text": top.get("textDisplay", ""),
                    "like_count": int(top.get("likeCount", 0)),
                }
            )

youtube_videos = pd.DataFrame(video_rows)
youtube_comments = pd.DataFrame(comment_rows)
youtube_quota_used = {
    "search_units": n_search * COST_SEARCH,
    "video_units": n_video_calls * COST_VIDEOS,
    "comment_units": n_comment_calls * COST_COMMENTS,
}
youtube_quota_used["total"] = sum(youtube_quota_used.values())

print(
    f"Videos: {len(youtube_videos)} | Comments: {len(youtube_comments)} | "
    f"Quota: {youtube_quota_used}"
)
