export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

export function trackPageView(url: string) {
  gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

export function trackScreenView(screenName: string) {
  gtag('event', 'screen_view', { screen_name: screenName });
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  gtag('event', action, params);
}
