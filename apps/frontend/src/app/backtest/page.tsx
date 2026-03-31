'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FlaskConical, CheckCircle2, XCircle, Clock, Target } from 'lucide-react';
import { useBacktestAccuracy, useBacktestResults } from '@/hooks/useTrends';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  sports: '#10b981',
  food: '#f59e0b',
  tech: '#6366f1',
  wellness: '#3b82f6',
  culture: '#f97316',
};

type OutcomeFilter = 'all' | 'mainstream' | 'fizzled';

export default function BacktestPage() {
  const {
    data: accuracy,
    isLoading: loadingAccuracy,
    isError: isAccuracyError,
    error: accuracyError,
    refetch: refetchAccuracy,
  } = useBacktestAccuracy();
  const {
    data: results,
    isLoading: loadingResults,
    isError: isResultsError,
    error: resultsError,
    refetch: refetchResults,
  } = useBacktestResults();
  const [filter, setFilter] = useState<OutcomeFilter>('all');

  const filtered = useMemo(() => {
    if (!results) return [];
    if (filter === 'all') return results;
    return results.filter((r: any) => r.actualOutcome === filter);
  }, [results, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10" aria-busy={loadingAccuracy || loadingResults}>
      {(isAccuracyError || isResultsError) && (
        <QueryErrorState
          error={accuracyError ?? resultsError}
          title="Unable to load backtest data"
          onRetry={() => {
            void refetchAccuracy();
            void refetchResults();
          }}
          className="mb-8"
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="w-6 h-6 text-tipping" />
          <h1 className="text-2xl sm:text-3xl font-bold">Back-Test Dashboard</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Historical validation of our Tipping Point Score against 50+ trends with known outcomes.
        </p>
      </div>

      {/* Stats Cards */}
      {loadingAccuracy ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : accuracy && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-surface border border-border rounded-xl p-5 text-center">
            <Target className="w-5 h-5 text-tipping mx-auto mb-2" />
            <div className="text-3xl sm:text-4xl font-mono font-bold text-tipping">
              {(accuracy.overallAccuracy * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-text-secondary mt-1">Overall Accuracy</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 text-center">
            <Clock className="w-5 h-5 text-early mx-auto mb-2" />
            <div className="text-3xl sm:text-4xl font-mono font-bold text-early">
              {accuracy.avgWeeksBeforePeak}
            </div>
            <div className="text-xs text-text-secondary mt-1">Avg Weeks Before Peak</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400">
              {accuracy.correctPredictions}
            </div>
            <div className="text-xs text-text-secondary mt-1">Correct Predictions</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 text-center">
            <FlaskConical className="w-5 h-5 text-discovery mx-auto mb-2" />
            <div className="text-3xl sm:text-4xl font-mono font-bold text-discovery">
              {accuracy.totalTrends}
            </div>
            <div className="text-xs text-text-secondary mt-1">Total Trends Tested</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 text-center">
            <Target className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <div className="text-3xl sm:text-4xl font-mono font-bold text-indigo-400">
              {((accuracy.outcomeMetrics?.precision ?? 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-text-secondary mt-1">Precision</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 text-center">
            <Target className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <div className="text-3xl sm:text-4xl font-mono font-bold text-cyan-400">
              {((accuracy.outcomeMetrics?.recall ?? 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-text-secondary mt-1">Recall</div>
          </div>
        </motion.div>
      )}

      {/* Statistical Depth */}
      {accuracy && (
        <motion.div
          className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Statistical Confidence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-text-secondary mb-1">95% CI (accuracy)</p>
              <p className="font-mono text-text-primary">
                {(accuracy.overallAccuracyCI95?.lower * 100 || 0).toFixed(1)}% - {(accuracy.overallAccuracyCI95?.upper * 100 || 0).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-text-secondary mb-1">F1 Score</p>
              <p className="font-mono text-text-primary">{((accuracy.outcomeMetrics?.f1 ?? 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-text-secondary mb-1">Weeks Early (P50/P90)</p>
              <p className="font-mono text-text-primary">
                {accuracy.weeksBeforePeakDistribution?.p50 ?? 0}w / {accuracy.weeksBeforePeakDistribution?.p90 ?? 0}w
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Accuracy by Category Chart */}
      {accuracy?.categoryAccuracy && (
        <motion.div
          className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Accuracy by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={accuracy.categoryAccuracy.map((c: any) => ({ ...c, pct: Math.round(c.accuracy * 100) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="category" stroke="#555" tick={{ fontSize: 11 }} className="capitalize" />
              <YAxis domain={[0, 100]} stroke="#555" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 8 }}
                labelStyle={{ color: '#888' }}
                formatter={(v: number) => [`${v}%`, 'Accuracy']}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {accuracy.categoryAccuracy.map((c: any, i: number) => (
                  <Cell key={i} fill={CATEGORY_COLORS[c.category] ?? '#888'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Confusion Matrix */}
      {accuracy?.outcomeMetrics?.confusionMatrix && (
        <motion.div
          className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Mainstream Outcome Confusion Matrix</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-text-secondary">True Positive</p>
              <p className="font-mono text-xl text-emerald-400">{accuracy.outcomeMetrics.confusionMatrix.truePositive}</p>
            </div>
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
              <p className="text-text-secondary">False Positive</p>
              <p className="font-mono text-xl text-rose-400">{accuracy.outcomeMetrics.confusionMatrix.falsePositive}</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-text-secondary">False Negative</p>
              <p className="font-mono text-xl text-amber-400">{accuracy.outcomeMetrics.confusionMatrix.falseNegative}</p>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
              <p className="text-text-secondary">True Negative</p>
              <p className="font-mono text-xl text-sky-400">{accuracy.outcomeMetrics.confusionMatrix.trueNegative}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'mainstream', 'fizzled'] as OutcomeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors',
                filter === f
                  ? 'bg-tipping/10 text-tipping border border-tipping/30'
                  : 'bg-surface text-text-secondary border border-border hover:text-text-primary',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {loadingResults ? (
          <Skeleton className="h-64" />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-secondary">
            <p className="text-base">No backtest rows for this filter.</p>
            <p className="text-sm mt-1">Switch to another outcome to inspect more results.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Trend</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Predicted</th>
                  <th className="text-right px-4 py-3 text-text-secondary font-medium">Score</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Outcome</th>
                  <th className="text-center px-4 py-3 text-text-secondary font-medium hidden md:table-cell">Correct</th>
                  <th className="text-right px-4 py-3 text-text-secondary font-medium hidden lg:table-cell">Weeks Early</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <a href={`/trends/${r.trend?.slug}`} className="hover:text-tipping transition-colors">
                        {r.trend?.name ?? 'Unknown'}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-text-secondary capitalize hidden sm:table-cell">{r.trend?.category}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{r.predictedStage?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-tipping">{Number(r.predictedScore).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        r.actualOutcome === 'mainstream' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
                      )}>
                        {r.actualOutcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {r.wasCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary hidden lg:table-cell">
                      {r.weeksBeforePeak ? `${r.weeksBeforePeak}w` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
