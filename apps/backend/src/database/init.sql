CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS trends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  is_historical BOOLEAN DEFAULT FALSE,
  actual_outcome TEXT
);

CREATE TABLE IF NOT EXISTS trend_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id              UUID REFERENCES trends(id) ON DELETE CASCADE,
  scored_at             TIMESTAMPTZ DEFAULT NOW(),
  tipping_point_score   NUMERIC(5,2),
  discourse_stage       TEXT NOT NULL,
  stage_confidence      NUMERIC(4,3),
  google_trend_value    INTEGER,
  google_trend_velocity NUMERIC(8,4),
  reddit_post_count     INTEGER,
  reddit_comment_count  INTEGER,
  reddit_sentiment      NUMERIC(4,3),
  wikipedia_pageviews   INTEGER,
  cross_platform_score  NUMERIC(5,2)
);

CREATE TABLE IF NOT EXISTS reddit_samples (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id         UUID REFERENCES trends(id) ON DELETE CASCADE,
  fetched_at       TIMESTAMPTZ DEFAULT NOW(),
  subreddit        TEXT,
  post_title       TEXT,
  post_body        TEXT,
  post_score       INTEGER,
  num_comments     INTEGER,
  discourse_label  TEXT,
  label_confidence NUMERIC(4,3)
);

CREATE TABLE IF NOT EXISTS backtest_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id          UUID REFERENCES trends(id) ON DELETE CASCADE,
  run_at            TIMESTAMPTZ DEFAULT NOW(),
  predicted_stage   TEXT,
  predicted_score   NUMERIC(5,2),
  actual_outcome    TEXT,
  was_correct       BOOLEAN,
  weeks_before_peak INTEGER
);

CREATE TABLE IF NOT EXISTS alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    TEXT NOT NULL,
  trend_id      UUID REFERENCES trends(id) ON DELETE CASCADE,
  trigger_stage TEXT,
  trigger_score NUMERIC(5,2),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trend_scores_trend_id  ON trend_scores(trend_id);
CREATE INDEX IF NOT EXISTS idx_trend_scores_scored_at ON trend_scores(scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_scores_stage     ON trend_scores(discourse_stage);
CREATE INDEX IF NOT EXISTS idx_trends_category        ON trends(category);
CREATE INDEX IF NOT EXISTS idx_reddit_trend_id        ON reddit_samples(trend_id);
CREATE INDEX IF NOT EXISTS idx_alerts_email           ON alerts(user_email);
