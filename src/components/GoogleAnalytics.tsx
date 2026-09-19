'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/constants';

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  // Вне прода реальный gtag.js не грузим: дев/тесты не должны слать
  // статистику. Вместо загрузчика — no-op стаб, чтобы фасад (очередь,
  // диспетчер, analytics.spec с его dataLayer-ловушкой) оставался жив.
  if (process.env.NODE_ENV !== 'production') {
    return (
      <Script id="ga-e2e-stub" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
        `}
      </Script>
    );
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
