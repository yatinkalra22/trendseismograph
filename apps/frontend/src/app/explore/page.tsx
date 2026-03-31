'use client';

import { Suspense, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreateAlert, useSearch } from '@/hooks/useTrends';
import { TrendCard } from '@/components/trends/TrendCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { cn } from '@/lib/utils';

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Skeleton className="h-10 w-64 mb-2" label="Loading explore page" />
      <Skeleton className="h-5 w-96 max-w-full mb-8" />
      <Skeleton className="h-12 w-full mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-72 max-w-lg" />
    </div>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const alertSlug = searchParams.get('alert') ?? '';
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [queryInput, setQueryInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const normalizedQueryInput = useMemo(() => queryInput.trim(), [queryInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(normalizedQueryInput);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [normalizedQueryInput]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = Boolean(
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable),
      );

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === 'Escape' && document.activeElement === searchInputRef.current && queryInput.length > 0) {
        event.preventDefault();
        setQueryInput('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [queryInput.length]);

  const { data: results, isLoading, isFetching, isError, error, refetch } = useSearch(debouncedQuery);
  const createAlertMutation = useCreateAlert();

  // Alert form state
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTrend, setAlertTrend] = useState(alertSlug);
  const [alertScore, setAlertScore] = useState('7.0');
  const [alertSent, setAlertSent] = useState(false);

  const parsedScore = useMemo(() => Number.parseFloat(alertScore), [alertScore]);
  const isScoreInvalid = Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10;
  const isAlertFormInvalid = !alertEmail.trim() || !alertTrend.trim() || isScoreInvalid;

  const handleAlert = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isScoreInvalid) {
      return;
    }
    try {
      await createAlertMutation.mutateAsync({
        email: alertEmail,
        slug: alertTrend,
        triggerScore: parsedScore,
      });
      setAlertSent(true);
    } catch {
      // Error toast is handled globally by MutationCache in providers.
    }
  }, [alertEmail, alertTrend, parsedScore, isScoreInvalid, createAlertMutation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10" aria-busy={isLoading}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Explore Trends</h1>
        <p className="text-text-secondary text-sm">Search across all tracked trends and set up alerts.</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          ref={searchInputRef}
          type="text"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search trends... (e.g. pickleball, oat milk, solarpunk)"
          aria-label="Search trends"
          className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tipping/40 transition-colors"
        />
      </div>
      <p className="mb-3 text-xs text-text-secondary">Tip: press / to focus search, Esc to clear.</p>

      {normalizedQueryInput.length === 1 && (
        <p className="mb-6 text-xs text-text-secondary">Keep typing to search (minimum 2 characters).</p>
      )}

      {/* Search Results */}
      {normalizedQueryInput.length > 1 && (
        <div className="mb-10" aria-live="polite">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">
            {normalizedQueryInput !== debouncedQuery
              ? `Searching for "${normalizedQueryInput}"...`
              : isFetching && !isLoading
                ? `Updating results for "${debouncedQuery}"...`
              : isLoading
                ? 'Searching...'
                : isError
                ? `Search failed for "${debouncedQuery}"`
                : `${results?.length ?? 0} results for "${debouncedQuery}"`}
          </h2>
          {isError && (
            <QueryErrorState
              error={error}
              title="Unable to search trends"
              onRetry={() => {
                void refetch();
              }}
              className="mb-4"
            />
          )}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36" label="Searching trends" />
              ))}
            </div>
          )}
          {results && results.length > 0 && !isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((t: any, i: number) => (
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
                      latestScore: null,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
          {results && results.length === 0 && !isLoading && !isError && (
            <p className="text-text-secondary text-sm">No trends found matching your search.</p>
          )}
        </div>
      )}

      {/* Alert Form */}
      <motion.div
        className="bg-surface border border-border rounded-xl p-6 max-w-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-tipping" />
          <h2 className="text-lg font-semibold">Set Up Alert</h2>
        </div>
        <p className="text-sm text-text-secondary mb-6">
          Get emailed when a trend crosses your score threshold.
        </p>

        {alertSent ? (
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Alert created! You&apos;ll be notified by email.</span>
          </div>
        ) : (
          <form onSubmit={handleAlert} className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Email</label>
              <input
                type="email"
                required
                value={alertEmail}
                onChange={(e) => {
                  setAlertEmail(e.target.value);
                  setAlertSent(false);
                }}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tipping/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Trend slug</label>
              <input
                type="text"
                required
                value={alertTrend}
                onChange={(e) => {
                  setAlertTrend(e.target.value);
                  setAlertSent(false);
                }}
                placeholder="pickleball"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tipping/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Trigger when TPS reaches</label>
              <input
                type="number"
                required
                min="0"
                max="10"
                step="0.5"
                value={alertScore}
                onChange={(e) => {
                  setAlertScore(e.target.value);
                  setAlertSent(false);
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary font-mono focus:outline-none focus:border-tipping/40 transition-colors"
              />
              {isScoreInvalid && (
                <p className="mt-1 text-xs text-red-400">Score must be a number between 0 and 10.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={createAlertMutation.isPending || isAlertFormInvalid}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                createAlertMutation.isPending || isAlertFormInvalid
                  ? 'bg-tipping/50 text-background cursor-not-allowed'
                  : 'bg-tipping text-background hover:bg-tipping/90',
              )}
            >
              {createAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Create Alert
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
