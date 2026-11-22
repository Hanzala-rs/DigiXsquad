'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

const mocking = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
      }),
  );
  const mswReady = useMockServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      {/* With mocks on (dev only), wait for the worker so the first queries hit MSW. */}
      {mswReady ? children : null}
    </QueryClientProvider>
  );
}

function useMockServiceWorker() {
  const [ready, setReady] = useState(!mocking);
  useEffect(() => {
    if (!mocking) return;
    let active = true;
    import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass', quiet: true }))
      .catch((err) => console.error('[msw] failed to start', err))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);
  return ready;
}
