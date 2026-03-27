'use client';

import Link from 'next/link';
import { StageLabel } from '@/components/scoring/StageLabel';
import { CATEGORY_ICONS } from '@/lib/constants';

interface Props {
  trend: {
    slug: string;
    name: string;
    category: string;
    latestScore?: {
      tippingPointScore: number;
      discourseStage: string;
      googleTrendVelocity: number;
    } | null;
  };
}

export function TrendCard({ trend }: Props) {
  const score = trend.latestScore?.tippingPointScore ?? 0;
  const stage = trend.latestScore?.discourseStage ?? 'discovery';
  const velocity = trend.latestScore?.googleTrendVelocity ?? 0;
  const velocitySign = velocity > 0 ? '+' : '';
  const icon = CATEGORY_ICONS[trend.category] ?? '';

  return (
    <Link href={`/trends/${trend.slug}`}>
      <div className="bg-surface border border-border rounded-xl p-4 hover:border-tipping/40 hover:bg-surface-hover transition-all duration-200 cursor-pointer group h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-text-primary group-hover:text-tipping transition-colors truncate">
              {trend.name}
            </h3>
            <span className="text-xs text-text-secondary capitalize">
              {icon} {trend.category}
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-tipping ml-3 shrink-0">
            {score.toFixed(1)}
          </div>
        </div>

        <StageLabel stage={stage} />

        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <span className={velocity >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {velocitySign}{velocity.toFixed(1)}% this week
          </span>
        </div>
      </div>
    </Link>
  );
}
