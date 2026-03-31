export type DiscourseStage = 'discovery' | 'early_adoption' | 'tipping_point' | 'mainstream';

export type BacktestOutcome = 'mainstream' | 'fizzled';

export interface TrendScore {
  tippingPointScore: number;
  discourseStage: DiscourseStage;
  googleTrendVelocity: number;
  googleTrendValue?: number;
  redditPostCount?: number;
  wikipediaPageviews?: number;
  stageConfidence: number;
}

export interface TrendSummary {
  slug: string;
  name: string;
  category: string;
  tippingPointScore: number;
  discourseStage: DiscourseStage;
  googleTrendVelocity: number;
}

export interface TrendSearchResult {
  slug: string;
  name: string;
  category: string;
}

export interface TrendDetail {
  slug: string;
  name: string;
  category: string;
  isHistorical?: boolean;
  actualOutcome?: BacktestOutcome;
  latestScore: TrendScore | null;
}

export interface TrendHistoryPoint {
  scoredAt: string;
  tippingPointScore: number;
  googleTrendValue: number;
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
  categoryAccuracy: BacktestCategoryAccuracy[];
  outcomeMetrics?: BacktestOutcomeMetrics;
  overallAccuracyCI95?: {
    lower: number;
    upper: number;
  };
  weeksBeforePeakDistribution?: {
    p50: number;
    p90: number;
  };
}

export interface BacktestResult {
  id: string | number;
  trend?: {
    slug: string;
    name: string;
    category: string;
  };
  predictedStage?: string;
  predictedScore: number;
  actualOutcome: BacktestOutcome;
  wasCorrect: boolean;
  weeksBeforePeak?: number;
}

export interface CreateAlertPayload {
  email: string;
  slug: string;
  triggerStage?: string;
  triggerScore?: number;
}