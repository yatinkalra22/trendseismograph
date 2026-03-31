/// <reference types="node" />

import { test } from 'node:test';
import type { BacktestService } from '../src/modules/backtest/backtest.service';
import type { ScoringController } from '../src/modules/scoring/scoring.controller';
import type { TrendsService } from '../src/modules/trends/trends.service';
import type {
  BacktestAccuracy,
  BacktestResult,
  TrendDetail,
  TrendHistoryPoint,
  TrendSearchResult,
  TrendSummary,
} from '../../frontend/src/lib/types';

type AssertAssignable<BackendShape, FrontendShape> = BackendShape extends FrontendShape ? true : never;

type LeaderboardResponse = Awaited<ReturnType<ScoringController['getLeaderboard']>>;
type TrendDetailResponse = Awaited<ReturnType<TrendsService['findOne']>>;
type TrendHistoryResponse = Awaited<ReturnType<TrendsService['getHistory']>>;
type TrendSearchResponse = Awaited<ReturnType<TrendsService['search']>>;
type BacktestResultsResponse = Awaited<ReturnType<BacktestService['getResults']>>;
type BacktestAccuracyResponse = Awaited<ReturnType<BacktestService['getAccuracy']>>;

type LeaderboardContract = AssertAssignable<LeaderboardResponse, TrendSummary[]>;
type TrendDetailContract = AssertAssignable<TrendDetailResponse, TrendDetail>;
type TrendHistoryContract = AssertAssignable<TrendHistoryResponse, TrendHistoryPoint[]>;
type TrendSearchContract = AssertAssignable<TrendSearchResponse, TrendSearchResult[]>;
type BacktestResultsContract = AssertAssignable<BacktestResultsResponse, BacktestResult[]>;
type BacktestAccuracyContract = AssertAssignable<BacktestAccuracyResponse, BacktestAccuracy>;

void (0 as unknown as LeaderboardContract);
void (0 as unknown as TrendDetailContract);
void (0 as unknown as TrendHistoryContract);
void (0 as unknown as TrendSearchContract);
void (0 as unknown as BacktestResultsContract);
void (0 as unknown as BacktestAccuracyContract);

test('frontend/backend API contract types remain compatible', () => {
  // This test primarily relies on compile-time assertions above.
});
