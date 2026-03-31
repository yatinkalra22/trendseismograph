'use client';

import { memo } from 'react';
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/constants';

interface Props {
  stage: string;
  size?: 'sm' | 'md';
}

export const StageLabel = memo(function StageLabel({ stage, size = 'sm' }: Props) {
  const color = STAGE_COLORS[stage] ?? '#888';
  const label = STAGE_LABELS[stage] ?? stage;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
});
