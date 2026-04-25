"""
Zerve block: load_trends
Type: Python
Inputs (project files): trends.csv (uploaded into the Zerve project root)
Outputs (read by downstream blocks via `variable("load_trends", "<name>")`):
    trends_df          : pandas.DataFrame
        Columns: slug, name, category, is_historical (bool), actual_outcome
    backtest_universe  : pandas.DataFrame
        Subset where is_historical is True (the labelled set used on Day 3).
    pending_universe   : pandas.DataFrame
        Subset where is_historical is False (the live leaderboard set).

The CSV ships in this repo at data/trends.csv. After uploading it to the
Zerve project, no edits to this cell should be needed.
"""
import pandas as pd

TRENDS_CSV_PATH = "trends.csv"


def _load(path: str) -> pd.DataFrame:
    df = pd.read_csv(
        path,
        dtype={
            "slug": "string",
            "name": "string",
            "category": "string",
            "is_historical": "string",
            "actual_outcome": "string",
        },
    )
    required = {"slug", "name", "category", "is_historical", "actual_outcome"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"trends.csv is missing required columns: {sorted(missing)}")

    df["is_historical"] = df["is_historical"].str.lower().eq("true")
    df["actual_outcome"] = df["actual_outcome"].fillna("pending")
    df = df.drop_duplicates(subset=["slug"]).reset_index(drop=True)
    return df


trends_df = _load(TRENDS_CSV_PATH)
backtest_universe = trends_df[trends_df["is_historical"]].reset_index(drop=True)
pending_universe = trends_df[~trends_df["is_historical"]].reset_index(drop=True)

print(
    f"Loaded {len(trends_df)} trends "
    f"({len(backtest_universe)} historical, {len(pending_universe)} pending)."
)
print("Outcome distribution:", trends_df["actual_outcome"].value_counts().to_dict())
print("Category distribution:", trends_df["category"].value_counts().to_dict())
