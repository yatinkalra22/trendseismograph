'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Flame } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useTrends';
import { useAppStore } from '@/store/useAppStore';
import { TrendCard } from '@/components/trends/TrendCard';
import { StageLabel } from '@/components/scoring/StageLabel';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STAGE_FILTERS = [
  { value: null, label: 'All' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'early_adoption', label: 'Early Adoption' },
  { value: 'tipping_point', label: 'Tipping Point' },
  { value: 'mainstream', label: 'Mainstream' },
];

export default function DashboardPage() {
  const { data: leaderboard, isLoading, isError, error, refetch } = useLeaderboard();
  const { selectedStage, selectedCategory, viewMode, setStage, setCategory, setViewMode } = useAppStore();

  const filtered = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.filter((t: any) => {
      if (selectedStage && t.discourseStage !== selectedStage) return false;
      if (selectedCategory && t.category !== selectedCategory) return false;
      return true;
    });
  }, [leaderboard, selectedStage, selectedCategory]);

  const tippingNow = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.filter((t: any) => t.discourseStage === 'tipping_point');
  }, [leaderboard]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10" aria-busy={isLoading}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">
            {leaderboard?.length ?? 0} trends tracked, ranked by Tipping Point Score
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Switch to grid view"
            aria-pressed={viewMode === 'grid'}
            className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-surface text-tipping' : 'text-text-secondary hover:text-text-primary')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="Switch to table view"
            aria-pressed={viewMode === 'table'}
            className={cn('p-2 rounded-lg transition-colors', viewMode === 'table' ? 'bg-surface text-tipping' : 'text-text-secondary hover:text-text-primary')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tipping Now Banner */}
      {tippingNow.length > 0 && (
        <motion.div
          className="mb-8 p-4 rounded-xl bg-tipping/5 border border-tipping/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-tipping" />
            <span className="font-semibold text-tipping">Tipping Now</span>
            <span className="text-xs text-text-secondary">({tippingNow.length} trends at tipping point)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tippingNow.map((t: any) => (
              <Link
                key={t.slug}
                href={`/trends/${t.slug}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-tipping/40 transition-colors text-sm"
              >
                <span className="font-mono font-bold text-tipping">{Number(t.tippingPointScore).toFixed(1)}</span>
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {isError && (
        <QueryErrorState
          error={error}
          title="Unable to load trend leaderboard"
          onRetry={() => {
            void refetch();
          }}
          className="mb-6"
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Stage pills */}
        <div className="flex flex-wrap gap-2">
          {STAGE_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setStage(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                selectedStage === f.value
                  ? 'bg-tipping/10 text-tipping border border-tipping/30'
                  : 'bg-surface text-text-secondary border border-border hover:text-text-primary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              !selectedCategory
                ? 'bg-surface text-text-primary border border-text-secondary/30'
                : 'bg-surface text-text-secondary border border-border hover:text-text-primary',
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors',
                selectedCategory === cat
                  ? 'bg-surface text-text-primary border border-text-secondary/30'
                  : 'bg-surface text-text-secondary border border-border hover:text-text-primary',
              )}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t: any, i: number) => (
            <motion.div
              key={t.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <TrendCard
                trend={{
                  slug: t.slug,
                  name: t.name,
                  category: t.category,
                  latestScore: {
                    tippingPointScore: t.tippingPointScore,
                    discourseStage: t.discourseStage,
                    googleTrendVelocity: t.googleTrendVelocity,
                  },
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">#</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Trend</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium">TPS</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium hidden md:table-cell">Stage</th>
                <th className="text-right px-4 py-3 text-text-secondary font-medium hidden lg:table-cell">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: any, i: number) => (
                <tr
                  key={t.slug}
                  className="border-b border-border hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3 text-text-secondary font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/trends/${t.slug}`} className="hover:text-tipping transition-colors">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize hidden sm:table-cell">{t.category}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-tipping">{Number(t.tippingPointScore).toFixed(1)}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><StageLabel stage={t.discourseStage} /></td>
                  <td className={`px-4 py-3 text-right font-mono hidden lg:table-cell ${Number(t.googleTrendVelocity) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(t.googleTrendVelocity) > 0 ? '+' : ''}{Number(t.googleTrendVelocity).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-text-secondary">
          <p className="text-lg">No trends match your filters</p>
          <p className="text-sm mt-1">Try changing stage/category or clearing all filters.</p>
          <button onClick={() => { setStage(null); setCategory(null); }} className="text-tipping text-sm mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
