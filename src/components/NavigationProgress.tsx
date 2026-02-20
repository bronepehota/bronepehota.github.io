'use client';

import { useEffect, useState } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({
  minimum: 0.1,
  easing: 'ease',
  speed: 400,
  showSpinner: false,
  trickleSpeed: 200,
});

/**
 * Global navigation progress bar.
 * Shows a progress indicator at the top of the page during navigation.
 */
export default function NavigationProgress() {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Start progress on route change
    const handleStart = () => {
      NProgress.start();
    };

    // Complete progress when route change finishes
    const handleComplete = () => {
      NProgress.done();
    };

    // Listen to navigation events
    // Note: In Next.js App Router, we use a MutationObserver to detect route changes
    const observer = new MutationObserver(() => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath && currentPath !== '') {
        handleComplete();
      }
      setCurrentPath(newPath);
    });

    // Observe the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && !link.target && !link.hasAttribute('download')) {
        const linkUrl = new URL(link.href);
        const isInternal = linkUrl.origin === window.location.origin;

        if (isInternal) {
          handleStart();
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick);
    };
  }, [currentPath]);

  return null; // This component doesn't render anything
}
