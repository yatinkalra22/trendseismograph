'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { STAGE_COLORS } from '@/lib/constants';

interface Props {
  score: number;
  stage: string;
}

export const TippingPointMeter = memo(function TippingPointMeter({ score, stage }: Props) {
  const pct = (score / 10) * 100;
  const color = STAGE_COLORS[stage] ?? '#10b981';

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="text-6xl sm:text-7xl font-mono font-bold"
        style={{ color }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {Number(score).toFixed(1)}
      </motion.div>

      <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      <p className="text-sm text-text-secondary font-mono">Tipping Point Score</p>
    </div>
  );
});
