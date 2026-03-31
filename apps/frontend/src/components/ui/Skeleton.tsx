import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  label?: string;
}

export function Skeleton({ className, label = 'Loading' }: Props) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-surface', className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
    </div>
  );
}
