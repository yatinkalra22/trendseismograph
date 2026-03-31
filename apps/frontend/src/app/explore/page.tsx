'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { useSearch } from '@/hooks/useTrends';
import { TrendCard } from '@/components/trends/TrendCard';
import { createAlert, getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-text-secondary">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const alertSlug = searchParams.get('alert') ?? '';

  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useSearch(query);

  // Alert form state
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTrend, setAlertTrend] = useState(alertSlug);
  const [alertScore, setAlertScore] = useState('7.0');
  const [alertSent, setAlertSent] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);

  const handleAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError('');
    setAlertLoading(true);
    try {
      await createAlert({
        email: alertEmail,
        slug: alertTrend,
        triggerScore: parseFloat(alertScore),
      });
      setAlertSent(true);
    } catch (err: unknown) {
      setAlertError(getApiErrorMessage(err));
    } finally {
      setAlertLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Explore Trends</h1>
        <p className="text-text-secondary text-sm">Search across all tracked trends and set up alerts.</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trends... (e.g. pickleball, oat milk, solarpunk)"
          className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tipping/40 transition-colors"
        />
      </div>

      {/* Search Results */}
      {query.length > 1 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">
            {isLoading ? 'Searching...' : `${results?.length ?? 0} results for "${query}"`}
          </h2>
          {results && results.length > 0 && (
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
          {results && results.length === 0 && !isLoading && (
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
                onChange={(e) => setAlertEmail(e.target.value)}
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
                onChange={(e) => setAlertTrend(e.target.value)}
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
                onChange={(e) => setAlertScore(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary font-mono focus:outline-none focus:border-tipping/40 transition-colors"
              />
            </div>

            {alertError && <p className="text-red-400 text-xs">{alertError}</p>}

            <button
              type="submit"
              disabled={alertLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                alertLoading
                  ? 'bg-tipping/50 text-background cursor-not-allowed'
                  : 'bg-tipping text-background hover:bg-tipping/90',
              )}
            >
              {alertLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Create Alert
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
