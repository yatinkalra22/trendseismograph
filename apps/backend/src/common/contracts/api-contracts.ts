export type ApiDiscourseStage =
  | 'discovery'
  | 'early_adoption'
  | 'approaching_tipping'
  | 'tipping_point'
  | 'mainstream'
  | 'saturation';

export interface ApiTrendScore {
  tippingPointScore: number;
  discourseStage: ApiDiscourseStage;
  stageConfidence: number;
  googleTrendValue?: number | null;
  googleTrendVelocity: number;
  redditPostCount?: number | null;
  wikipediaPageviews?: number | null;
  scoredAt?: Date;
}

export interface ApiTrendSummary {
  slug: string;
  name: string;
  category: string | null;
  tippingPointScore: number;
  discourseStage: ApiDiscourseStage;
  googleTrendVelocity: number;
  stageConfidence?: number;
  googleTrendValue?: number | null;
  redditPostCount?: number | null;
  wikipediaPageviews?: number | null;
  scoredAt?: Date;
}

export interface ApiTrendDetail {
  slug: string;
  name: string;
  category: string | null;
  description?: string | null;
  isHistorical?: boolean;
  actualOutcome?: string | null;
  createdAt?: Date;
  latestScore: ApiTrendScore | null;
}

export interface ApiTrendHistoryPoint {
  scoredAt: Date;
  tippingPointScore: number;
  discourseStage: ApiDiscourseStage;
  googleTrendValue: number;
  googleTrendVelocity: number;
  redditPostCount: number;
  wikipediaPageviews: number;
}

export interface ApiTrendSearchResult {
  slug: string;
  name: string;
  category: string | null;
}

export interface ApiBacktestResult {
  id: string;
  trend?: {
    slug: string;
    name: string;
    category: string | null;
  };
  predictedStage?: string | null;
  predictedScore: number | null;
  actualOutcome: string | null;
  wasCorrect: boolean | null;
  weeksBeforePeak: number | null;
}

export interface ApiBacktestAccuracy {
  overallAccuracy: number;
  overallAccuracyCI95: {
    lower: number;
    upper: number;
  };
  totalTrends: number;
  evaluatedTrends: number;
  correctPredictions: number;
  avgWeeksBeforePeak: number;
  categoryAccuracy: Array<{
    category: string;
    accuracy: number;
    total: number;
    correct: number;
  }>;
  outcomeMetrics: {
    precision: number;
    recall: number;
    f1: number;
    confusionMatrix: {
      truePositive: number;
      falsePositive: number;
      falseNegative: number;
      trueNegative: number;
    };
  };
  weeksBeforePeakDistribution: {
    min: number;
    p50: number;
    p90: number;
    max: number;
  };
}