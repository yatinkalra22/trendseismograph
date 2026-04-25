"""
Zerve block: fetch_gdelt
Type: Python
Depends on: load_trends
Outputs:
    gdelt_timeline : DataFrame (slug, date, volume, tone)
        Daily news mention volume (% of all GDELT articles that day) and
        average tone (-100..+100) for each trend over TIMESPAN.

GDELT 2.0 DOC API is keyless. We query two timelines per trend
(TimelineVol for volume, TimelineTone for tone) and merge by date.
"""
import time

import pandas as pd
import requests

from zerve import variable

trends_df = variable("load_trends", "trends_df")

GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
TIMESPAN = "3m"
USER_AGENT = "trendseismograph/1.0 (zervehack 2026)"
REQUEST_TIMEOUT = 30
SLEEP_BETWEEN_CALLS = 1.0

HEADERS = {"User-Agent": USER_AGENT}


def _phrase(name: str) -> str:
    return f'"{name}"' if " " in name else name


def _timeline(query: str, mode: str) -> list[dict]:
    r = requests.get(
        GDELT_URL,
        params={"query": query, "mode": mode, "format": "json", "timespan": TIMESPAN},
        timeout=REQUEST_TIMEOUT,
        headers=HEADERS,
    )
    if r.status_code != 200 or not r.text.strip().startswith("{"):
        return []
    payload = r.json()
    series = payload.get("timeline", [])
    if not series:
        return []
    return series[0].get("data", [])


rows: list[dict] = []

for _, row in trends_df.iterrows():
    slug, name = row["slug"], row["name"]
    print(f"[gdelt] {slug} ({name})")
    q = _phrase(name)

    vol = _timeline(q, "TimelineVol")
    tone = _timeline(q, "TimelineTone")

    vol_by_date = {p["date"]: float(p.get("value", 0.0)) for p in vol}
    tone_by_date = {p["date"]: float(p.get("value", 0.0)) for p in tone}
    all_dates = sorted(set(vol_by_date) | set(tone_by_date))

    for d in all_dates:
        rows.append(
            {
                "slug": slug,
                "date": pd.to_datetime(d[:8], format="%Y%m%d"),
                "volume": vol_by_date.get(d, 0.0),
                "tone": tone_by_date.get(d, 0.0),
            }
        )

    time.sleep(SLEEP_BETWEEN_CALLS)


gdelt_timeline = pd.DataFrame(rows)
n_slugs = gdelt_timeline["slug"].nunique() if len(gdelt_timeline) else 0
print(f"GDELT rows: {len(gdelt_timeline)} across {n_slugs} slugs")
