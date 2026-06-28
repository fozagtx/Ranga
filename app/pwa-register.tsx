'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installability should never block the ranger workflow.
      });
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
}
