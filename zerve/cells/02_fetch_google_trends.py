"""
Zerve block: fetch_google_trends
Type: Python
Depends on: load_trends
Required packages (Environment > Requirements > Python): pytrends>=4.9
Outputs:
    gtrends_daily : DataFrame (slug, date, interest)
        ~90 days of daily relative search interest per trend (worldwide).
    gtrends_peaks : DataFrame (slug, peak_date, peak_value)
        Argmax of the 5-year monthly series. Day 3 backtest uses this as
        the ground-truth peak timing (the seed CSV does not carry peak dates).

`pytrends` rate-limits aggressively. We pace calls and retry on transient
errors. For 47 trends the cell takes ~5-7 minutes end-to-end.
"""
import time
import pandas as pd
from pytrends.request import TrendReq

from zerve import variable

trends_df = variable("load_trends", "trends_df")

DAILY_TIMEFRAME = "today 3-m"
LONG_TIMEFRAME = "today 5-y"
GEO = ""
SLEEP_BETWEEN_CALLS = 2.0
MAX_RETRIES = 3
RETRY_BACKOFF = 8.0


def _fetch_one(client: TrendReq, kw: str, timeframe: str) -> pd.DataFrame:
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            client.build_payload([kw], timeframe=timeframe, geo=GEO)
            df = client.interest_over_time()
            if df.empty:
                return pd.DataFrame(columns=["date", "interest"])
            df = df.reset_index()
            df = df.rename(columns={kw: "interest"})
            df["interest"] = df["interest"].astype(int)
            return df[["date", "interest"]]
        except Exception as e:
            last_err = e
            time.sleep(RETRY_BACKOFF * (attempt + 1))
    print(f"  ! gtrends failed for {kw!r}: {last_err}")
    return pd.DataFrame(columns=["date", "interest"])


client = TrendReq(hl="en-US", tz=0, retries=2, backoff_factor=0.5)

daily_frames: list[pd.DataFrame] = []
peak_rows: list[dict] = []

for _, row in trends_df.iterrows():
    slug, name = row["slug"], row["name"]
    print(f"[gtrends] {slug} ({name})")

    daily = _fetch_one(client, name, DAILY_TIMEFRAME)
    if not daily.empty:
        daily = daily.assign(slug=slug)
        daily_frames.append(daily)
    time.sleep(SLEEP_BETWEEN_CALLS)

    five_y = _fetch_one(client, name, LONG_TIMEFRAME)
    if not five_y.empty:
        idx = five_y["interest"].idxmax()
        peak_rows.append(
            {
                "slug": slug,
                "peak_date": pd.to_datetime(five_y.loc[idx, "date"]),
                "peak_value": int(five_y.loc[idx, "interest"]),
            }
        )
    time.sleep(SLEEP_BETWEEN_CALLS)


gtrends_daily = (
    pd.concat(daily_frames, ignore_index=True)
    if daily_frames
    else pd.DataFrame(columns=["slug", "date", "interest"])
)
gtrends_peaks = pd.DataFrame(peak_rows)

print(
    f"Daily rows: {len(gtrends_daily)} across "
    f"{gtrends_daily['slug'].nunique() if len(gtrends_daily) else 0} slugs"
)
print(f"Peaks resolved: {len(gtrends_peaks)} / {len(trends_df)}")
