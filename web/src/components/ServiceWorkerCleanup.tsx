'use client';

import { useEffect } from 'react';

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    // Unregister Netlify's service worker if it exists
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          // Unregister Netlify's monitoring service worker
          if (registration.scope.includes('netlify') || registration.active?.scriptURL.includes('cnm-sw')) {
            registration.unregister().catch(() => {
              // Silently fail if unregistration fails
            });
          }
        });
      });
    }
  }, []);

  return null;
}

