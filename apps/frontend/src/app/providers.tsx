'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import { ErrorToastProvider, useErrorToast } from '@/components/ui/ErrorToastProvider';

function QueryProviders({ children }: { children: React.ReactNode }) {
  const { showError } = useErrorToast();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Update mutation error handler with fresh showError callback to avoid stale closure
  useEffect(() => {
    queryClient.setMutationDefaults(['mutation'], {
      onError: (error) => {
        showError(getApiErrorMessage(error));
      },
    });
  }, [queryClient, showError]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorToastProvider>
      <QueryProviders>{children}</QueryProviders>
    </ErrorToastProvider>
  );
}
