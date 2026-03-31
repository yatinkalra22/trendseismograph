'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

const STAGES = ['discovery', 'early_adoption', 'tipping_point', 'mainstream', 'saturation'];
const LABELS = ['Discovery', 'Early Adoption', 'Tipping Point', 'Mainstream', 'Saturation'];

interface Props {
  currentStage: string;
}

// Memoized stage bar with stable animation logic
const StageBar = memo(function StageBar({ isActive, isPast }: { isActive: boolean; isPast: boolean }) {
  return (
    <motion.div
      className={`h-2 w-full rounded-full ${
        isPast
          ? 'bg-emerald-500'
          : isActive
            ? 'bg-emerald-400'
            : 'bg-surface border border-border'
      }`}
      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
      transition={isActive ? { repeat: Infinity, repeatType: 'reverse', duration: 1 } : {}}
    />
  );
});

export const StageTimeline = memo(function StageTimeline({ currentStage }: Props) {
  const currentIdx = useMemo(() => STAGES.indexOf(currentStage), [currentStage]);

  return (
    <div className="flex items-center gap-1 w-full">
      {STAGES.map((stage, i) => {
        const isActive = i === currentIdx;
        const isPast = i < currentIdx;

        return (
          <div key={stage} className="flex flex-col items-center flex-1">
            <StageBar isActive={isActive} isPast={isPast} />
            <span
              className={`text-[10px] sm:text-xs mt-1 text-center leading-tight ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-text-secondary'
              }`}
            >
              {LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
});
