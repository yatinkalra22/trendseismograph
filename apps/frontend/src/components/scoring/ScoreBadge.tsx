'use client';

import { memo } from 'react';
import { STAGE_COLORS } from '@/lib/constants';
import { formatScore } from '@/lib/utils';

interface Props {
  score: number;
  stage?: string;
  size?: 'sm' | 'lg';
}

export const ScoreBadge = memo(function ScoreBadge({ score, stage, size = 'sm' }: Props) {
  const color = stage ? (STAGE_COLORS[stage] ?? '#10b981') : '#10b981';

  return (
    <span
      className={`font-mono font-bold ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}
      style={{ color }}
    >
      {formatScore(score)}
    </span>
  );
});
