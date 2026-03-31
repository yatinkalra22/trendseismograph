'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import { ErrorToastProvider, useErrorToast } from '@/components/ui/ErrorToastProvider';

function QueryProviders({ children }: { children: React.ReactNode }) {
  const { showError } = useErrorToast();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error) => {
            showError(getApiErrorMessage(error));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorToastProvider>
      <QueryProviders>{children}</QueryProviders>
    </ErrorToastProvider>
  );
}
