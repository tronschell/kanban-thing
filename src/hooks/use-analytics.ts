'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      data?: Record<string, unknown>
    ) => void;
  }
}

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      window.gtag?.('event', 'page_view', {
        page_path: pathname,
        page_search: searchParams.toString(),
      });
    }
  }, [pathname, searchParams]);

  const trackEvent = (action: string, data?: Record<string, unknown>) => {
    window.gtag?.('event', action, data);
  };

  return { trackEvent };
} 