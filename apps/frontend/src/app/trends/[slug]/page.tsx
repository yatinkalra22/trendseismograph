'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, MessageSquare, Globe, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useTrend, useTrendHistory } from '@/hooks/useTrends';
import { TippingPointMeter } from '@/components/scoring/TippingPointMeter';
import { StageTimeline } from '@/components/scoring/StageTimeline';
import { StageLabel } from '@/components/scoring/StageLabel';
import { TpsHistoryChart } from '@/components/charts/TpsHistoryChart';
import { GoogleTrendsChart } from '@/components/charts/GoogleTrendsChart';
import { RedditActivityChart } from '@/components/charts/RedditActivityChart';
import { WikipediaChart } from '@/components/charts/WikipediaChart';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { formatNumber } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';

export default function TrendDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const {
    data: trend,
    isLoading,
    isError: isTrendError,
    error: trendError,
    refetch: refetchTrend,
  } = useTrend(slug);
  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useTrendHistory(slug);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (isTrendError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <QueryErrorState
          error={trendError}
          title="Unable to load trend details"
          onRetry={() => {
            void refetchTrend();
          }}
        />
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-text-secondary text-lg">Trend not found</p>
        <Link href="/dashboard" className="text-tipping text-sm mt-2 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const score = trend.latestScore;
  const category = trend.category ?? 'unknown';
  const icon = CATEGORY_ICONS[category] ?? '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10" aria-busy={isLoading || isHistoryLoading}>
      {/* Back link */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{trend.name}</h1>
          {score && <StageLabel stage={score.discourseStage} size="md" />}
        </div>
        <p className="text-text-secondary text-sm">
          {icon} {category} {trend.isHistorical && `\u00b7 Historical \u00b7 ${trend.actualOutcome}`}
        </p>
      </motion.div>

      {/* TPS Meter + Stage Timeline */}
      {score && (
        <motion.div
          className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="max-w-md mx-auto mb-8">
            <TippingPointMeter score={score.tippingPointScore} stage={score.discourseStage} />
          </div>
          <StageTimeline currentStage={score.discourseStage} />

          {/* Signal stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <TrendingUp className="w-4 h-4 text-discovery mx-auto mb-1" />
              <div className="font-mono font-bold text-lg">{score.googleTrendValue ?? 0}</div>
              <div className="text-xs text-text-secondary">Google Trends</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <MessageSquare className="w-4 h-4 text-early mx-auto mb-1" />
              <div className="font-mono font-bold text-lg">{formatNumber(score.redditPostCount ?? 0)}</div>
              <div className="text-xs text-text-secondary">Reddit Posts</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <BookOpen className="w-4 h-4 text-mainstream mx-auto mb-1" />
              <div className="font-mono font-bold text-lg">{formatNumber(score.wikipediaPageviews ?? 0)}</div>
              <div className="text-xs text-text-secondary">Wiki Pageviews</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <Globe className="w-4 h-4 text-tipping mx-auto mb-1" />
              <div className="font-mono font-bold text-lg">{Number(score.stageConfidence * 100).toFixed(0)}%</div>
              <div className="text-xs text-text-secondary">Confidence</div>
            </div>
          </div>
        </motion.div>
      )}

      {isHistoryError && (
        <QueryErrorState
          error={historyError}
          title="Unable to load trend history"
          onRetry={() => {
            void refetchHistory();
          }}
          className="mb-8"
        />
      )}

      {/* Charts Grid */}
      {isHistoryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72" label="Loading trend history" />
          ))}
        </div>
      )}

      {history && history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            className="bg-surface border border-border rounded-xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-text-secondary mb-4">TPS History (90 days)</h3>
            <TpsHistoryChart data={history} />
          </motion.div>

          <motion.div
            className="bg-surface border border-border rounded-xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-sm font-semibold text-text-secondary mb-4">Google Search Interest</h3>
            <GoogleTrendsChart data={history} />
          </motion.div>

          <motion.div
            className="bg-surface border border-border rounded-xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-text-secondary mb-4">Reddit Activity</h3>
            <RedditActivityChart data={history} />
          </motion.div>

          <motion.div
            className="bg-surface border border-border rounded-xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-sm font-semibold text-text-secondary mb-4">Wikipedia Pageviews</h3>
            <WikipediaChart data={history} />
          </motion.div>
        </div>
      )}

      {!isHistoryLoading && !isHistoryError && (!history || history.length === 0) && (
        <div className="mb-8 rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
          <p className="text-base">No history available for this trend yet.</p>
          <p className="text-sm mt-1">Check back after the next ingestion cycle.</p>
        </div>
      )}

      {/* Alert CTA */}
      <motion.div
        className="bg-surface border border-border rounded-xl p-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-semibold mb-2">Get notified about {trend.name}</h3>
        <p className="text-sm text-text-secondary mb-4">
          Set up an email alert when this trend crosses a score threshold.
        </p>
        <Link
          href={`/explore?alert=${trend.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2 bg-tipping text-background font-medium rounded-lg hover:bg-tipping/90 transition-colors text-sm"
        >
          Set Alert
        </Link>
      </motion.div>
    </div>
  );
}
