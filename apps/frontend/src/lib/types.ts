export type DiscourseStage =
  | 'discovery'
  | 'early_adoption'
  | 'approaching_tipping'
  | 'tipping_point'
  | 'mainstream'
  | 'saturation';

export type BacktestOutcome = 'mainstream' | 'fizzled';

export interface TrendScore {
  tippingPointScore: number;
  discourseStage: DiscourseStage;
  googleTrendVelocity: number;
  googleTrendValue?: number;
  redditPostCount?: number;
  wikipediaPageviews?: number;
  stageConfidence: number;
  scoredAt?: string | Date;
}

export interface TrendSummary {
  slug: string;
  name: string;
  category: string | null;
  tippingPointScore: number;
  discourseStage: DiscourseStage;
  googleTrendVelocity: number;
  stageConfidence?: number;
  googleTrendValue?: number | null;
  redditPostCount?: number | null;
  wikipediaPageviews?: number | null;
  scoredAt?: string;
}

export interface TrendSearchResult {
  slug: string;
  name: string;
  category: string | null;
}

export interface TrendDetail {
  slug: string;
  name: string;
  category: string | null;
  description?: string | null;
  isHistorical?: boolean;
  actualOutcome?: BacktestOutcome | string | null;
  createdAt?: string | Date;
  latestScore: TrendScore | null;
}

export interface PaginatedTrendsResponse {
  items: TrendDetail[];
  total: number;
  page: number;
  limit: number;
}

export interface TrendHistoryPoint {
  scoredAt: string | Date;
  tippingPointScore: number;
  discourseStage: DiscourseStage;
  googleTrendValue: number;
  googleTrendVelocity: number;
  redditPostCount: number;
  wikipediaPageviews: number;
}

export interface BacktestCategoryAccuracy {
  category: string;
  accuracy: number;
}

export interface BacktestOutcomeMetrics {
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    falseNegative: number;
    trueNegative: number;
  };
}

export interface BacktestAccuracy {
  overallAccuracy: number;
  avgWeeksBeforePeak: number;
  correctPredictions: number;
  totalTrends: number;
  evaluatedTrends?: number;
  categoryAccuracy: BacktestCategoryAccuracy[];
  outcomeMetrics?: BacktestOutcomeMetrics;
  overallAccuracyCI95?: {
    lower: number;
    upper: number;
  };
  weeksBeforePeakDistribution?: {
    min?: number;
    p50: number;
    p90: number;
    max?: number;
  };
}

export interface BacktestResult {
  id: string | number;
  trend?: {
    slug: string;
    name: string;
    category: string | null;
  };
  predictedStage?: string | null;
  predictedScore: number | null;
  actualOutcome: BacktestOutcome | string | null;
  wasCorrect: boolean | null;
  weeksBeforePeak?: number;
}

export interface CreateAlertPayload {
  email: string;
  slug: string;
  triggerStage?: string;
  triggerScore?: number;
}