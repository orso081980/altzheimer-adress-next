'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function SecurityTracker() {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    // Track access to entries pages
    if (pathname?.startsWith('/entries/')) {
      const event = status === 'authenticated' ? 'page_access' : 'unauthorized_access';
      const details = status === 'authenticated' 
        ? `Authenticated access to ${pathname}`
        : `Unauthenticated access attempt to ${pathname}`;

      fetch('/api/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          path: pathname,
          details,
        }),
      }).catch((error) => {
        console.error('Failed to track page access:', error);
      });
    }
  }, [pathname, status]);

  return null; // This component doesn't render anything
}