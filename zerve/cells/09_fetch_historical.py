"""
Zerve block: fetch_historical
Type: Python
Depends on: load_trends, fetch_google_trends
Required packages (Environment > Requirements > Python): pytrends>=4.9
Outputs:
    hist_gtrends : DataFrame (slug, date, interest)
    hist_wiki    : DataFrame (slug, date, views)
    hist_gdelt   : DataFrame (slug, date, volume, tone)

For each evaluable historical trend (actual_outcome in {mainstream, fizzled})
this cell fetches signals over [peak_date - 90d, peak_date + 30d] so the
Day 3 backtest can reconstruct the TPS that would have been emitted at
T = peak - 4 weeks. YouTube comments cannot be reconstructed historically;
the backtest substitutes GDELT volume/tone into the discourse term while
keeping the TPS formula and weights identical (see cell 10).

Wikipedia pageviews API: data exists from 2015-07-01 onwards.
GDELT 2.0 timeline: data exists from 2015-02-18 onwards.
"""
import time
from datetime import timedelta

import pandas as pd
import requests
from pytrends.request import TrendReq

from zerve import variable

trends_df = variable("load_trends", "trends_df")
gtrends_peaks = variable("fetch_google_trends", "gtrends_peaks")

LOOKBACK_DAYS = 90
LOOKAHEAD_DAYS = 30
USER_AGENT = "trendseismograph/1.0 (zervehack 2026)"
WIKI_PAGEVIEWS_URL = (
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
    "en.wikipedia/all-access/all-agents/{article}/daily/{start}/{end}"
)
WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php"
GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
GTRENDS_SLEEP = 2.0
WIKI_SLEEP = 0.4
GDELT_SLEEP = 1.0

HEADERS = {"User-Agent": USER_AGENT, "Accept": "application/json"}

evaluable = trends_df[trends_df["actual_outcome"].isin(["mainstream", "fizzled"])].copy()
evaluable = evaluable.merge(gtrends_peaks, on="slug", how="left")
evaluable = evaluable.dropna(subset=["peak_date"])
print(f"Evaluable historical trends with resolved peaks: {len(evaluable)}")


def _gtrends_window(client: TrendReq, kw: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    timeframe = f"{start.strftime('%Y-%m-%d')} {end.strftime('%Y-%m-%d')}"
    try:
        client.build_payload([kw], timeframe=timeframe, geo="")
        df = client.interest_over_time()
        if df.empty:
            return pd.DataFrame(columns=["date", "interest"])
        df = df.reset_index().rename(columns={kw: "interest"})
        df["interest"] = df["interest"].astype(int)
        return df[["date", "interest"]]
    except Exception as e:
        print(f"  ! gtrends window failed for {kw!r}: {e}")
        return pd.DataFrame(columns=["date", "interest"])


def _wiki_article(name: str) -> str | None:
    try:
        r = requests.get(
            WIKI_SEARCH_URL, timeout=15, headers=HEADERS,
            params={"action": "opensearch", "search": name, "limit": 1, "namespace": 0, "format": "json"},
        )
        data = r.json()
        if isinstance(data, list) and len(data) >= 2 and data[1]:
            return data[1][0].replace(" ", "_")
    except Exception:
        return None
    return None


def _wiki_window(article: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    floor = pd.Timestamp("2015-07-01")
    if end < floor:
        return pd.DataFrame(columns=["date", "views"])
    s = max(start, floor).strftime("%Y%m%d")
    e = end.strftime("%Y%m%d")
    url = WIKI_PAGEVIEWS_URL.format(article=requests.utils.quote(article, safe=""), start=s, end=e)
    try:
        r = requests.get(url, timeout=15, headers=HEADERS)
        if r.status_code != 200:
            return pd.DataFrame(columns=["date", "views"])
        items = r.json().get("items", [])
        return pd.DataFrame([
            {"date": pd.to_datetime(it["timestamp"][:8], format="%Y%m%d"), "views": int(it["views"])}
            for it in items
        ])
    except Exception:
        return pd.DataFrame(columns=["date", "views"])


def _gdelt_window(name: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    floor = pd.Timestamp("2015-02-18")
    if end < floor:
        return pd.DataFrame(columns=["date", "volume", "tone"])
    s = max(start, floor).strftime("%Y%m%d") + "000000"
    e = end.strftime("%Y%m%d") + "235959"
    q = f'"{name}"' if " " in name else name
    out: dict[str, dict] = {}
    for mode, key in (("TimelineVol", "volume"), ("TimelineTone", "tone")):
        try:
            r = requests.get(
                GDELT_URL,
                params={"query": q, "mode": mode, "format": "json",
                        "startdatetime": s, "enddatetime": e},
                timeout=30, headers={"User-Agent": USER_AGENT},
            )
            if r.status_code != 200 or not r.text.strip().startswith("{"):
                continue
            for p in r.json().get("timeline", [{}])[0].get("data", []):
                d = p["date"][:8]
                out.setdefault(d, {"volume": 0.0, "tone": 0.0})[key] = float(p.get("value", 0.0))
        except Exception as ex:
            print(f"  ! gdelt {mode} failed for {name!r}: {ex}")
    return pd.DataFrame([
        {"date": pd.to_datetime(d, format="%Y%m%d"), **vals} for d, vals in out.items()
    ]).sort_values("date") if out else pd.DataFrame(columns=["date", "volume", "tone"])


client = TrendReq(hl="en-US", tz=0, retries=2, backoff_factor=0.5)
gt_frames: list[pd.DataFrame] = []
wk_frames: list[pd.DataFrame] = []
gd_frames: list[pd.DataFrame] = []

for _, t in evaluable.iterrows():
    slug, name = t["slug"], t["name"]
    peak = pd.Timestamp(t["peak_date"]).normalize()
    win_start = peak - timedelta(days=LOOKBACK_DAYS)
    win_end = peak + timedelta(days=LOOKAHEAD_DAYS)
    print(f"[hist] {slug} peak={peak.date()} window=[{win_start.date()}..{win_end.date()}]")

    g = _gtrends_window(client, name, win_start, win_end)
    if not g.empty:
        gt_frames.append(g.assign(slug=slug))
    time.sleep(GTRENDS_SLEEP)

    article = _wiki_article(name)
    if article:
        w = _wiki_window(article, win_start, win_end)
        if not w.empty:
            wk_frames.append(w.assign(slug=slug))
    time.sleep(WIKI_SLEEP)

    gd = _gdelt_window(name, win_start, win_end)
    if not gd.empty:
        gd_frames.append(gd.assign(slug=slug))
    time.sleep(GDELT_SLEEP)


hist_gtrends = pd.concat(gt_frames, ignore_index=True) if gt_frames else pd.DataFrame(columns=["slug", "date", "interest"])
hist_wiki = pd.concat(wk_frames, ignore_index=True) if wk_frames else pd.DataFrame(columns=["slug", "date", "views"])
hist_gdelt = pd.concat(gd_frames, ignore_index=True) if gd_frames else pd.DataFrame(columns=["slug", "date", "volume", "tone"])

print(f"hist_gtrends: {len(hist_gtrends)} rows / {hist_gtrends['slug'].nunique() if len(hist_gtrends) else 0} slugs")
print(f"hist_wiki:    {len(hist_wiki)} rows / {hist_wiki['slug'].nunique() if len(hist_wiki) else 0} slugs")
print(f"hist_gdelt:   {len(hist_gdelt)} rows / {hist_gdelt['slug'].nunique() if len(hist_gdelt) else 0} slugs")
