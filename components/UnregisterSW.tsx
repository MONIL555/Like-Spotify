'use client';

import { useEffect } from 'react';

export function UnregisterSW() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          console.log('Unregistering ghost service worker:', registration);
          registration.unregister();
        }
      }).catch((err) => {
        console.error('Failed to unregister service worker', err);
      });
    }
  }, []);

  return null;
}
