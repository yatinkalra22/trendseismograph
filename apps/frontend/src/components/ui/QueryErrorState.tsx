'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api';

type QueryErrorStateProps = {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
};

export function QueryErrorState({
  error,
  title = 'Unable to load data',
  onRetry,
  className = '',
}: QueryErrorStateProps) {
  return (
    <div className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 sm:p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div>
          <h3 className="text-sm font-semibold text-red-100">{title}</h3>
          <p className="mt-1 text-sm text-red-100/90">{getApiErrorMessage(error)}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300/40 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:bg-red-400/15"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
