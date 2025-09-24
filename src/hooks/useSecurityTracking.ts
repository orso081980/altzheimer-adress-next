// Client-side hook to track page access
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useSecurityTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track entries pages on client side for additional logging
    if (pathname?.startsWith('/entries/')) {
      fetch('/api/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'page_access',
          path: pathname,
          details: 'Client-side page access tracking',
        }),
      }).catch((error) => {
        console.error('Failed to track page access:', error);
      });
    }
  }, [pathname]);
}

export default useSecurityTracking;