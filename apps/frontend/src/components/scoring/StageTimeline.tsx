'use client';

import { motion } from 'framer-motion';

const STAGES = ['discovery', 'early_adoption', 'tipping_point', 'mainstream', 'saturation'];
const LABELS = ['Discovery', 'Early Adoption', 'Tipping Point', 'Mainstream', 'Saturation'];

interface Props {
  currentStage: string;
}

export function StageTimeline({ currentStage }: Props) {
  const currentIdx = STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1 w-full">
      {STAGES.map((stage, i) => {
        const isActive = i === currentIdx;
        const isPast = i < currentIdx;

        return (
          <div key={stage} className="flex flex-col items-center flex-1">
            <motion.div
              className={`h-2 w-full rounded-full ${
                isPast
                  ? 'bg-emerald-500'
                  : isActive
                    ? 'bg-emerald-400'
                    : 'bg-surface border border-border'
              }`}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ repeat: isActive ? Infinity : 0, repeatType: 'reverse', duration: 1 }}
            />
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
}
