'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';
/** Dev with MSW: no Cloudflare widget, a fixed token is accepted by the mock. */
const MOCK = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';
export const MOCK_TURNSTILE_TOKEN = 'mock-turnstile-token';

/** Cloudflare Turnstile (free). Calls onToken with a token, or '' when it expires/fails. */
export function Turnstile({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void;
  resetKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(() => typeof window !== 'undefined' && !!window.turnstile);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (MOCK) onTokenRef.current(MOCK_TURNSTILE_TOKEN);
  }, [resetKey]);

  useEffect(() => {
    if (MOCK || !loaded || !ref.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      theme: 'dark',
      callback: (t: string) => onTokenRef.current(t),
      'expired-callback': () => onTokenRef.current(''),
      'error-callback': () => onTokenRef.current(''),
    });
    return () => window.turnstile?.remove(widgetId.current);
  }, [loaded]);

  useEffect(() => {
    if (!MOCK && resetKey && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  if (MOCK) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
        onReady={() => setLoaded(true)}
      />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
