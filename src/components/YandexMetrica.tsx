'use client';

import Script from 'next/script';
import { YANDEX_METRICA_ID } from '@/lib/constants';

/**
 * Yandex.Metrica counter — the RU-audience equivalent of Google Analytics.
 * Feeds behavioral signals Yandex uses for ranking + reliable RU analytics
 * (GA is partially blocked/unreliable in the region). No-ops without an id.
 */
export default function YandexMetrica() {
  if (!YANDEX_METRICA_ID) return null;

  // Вне прода tag.js не грузим: дев/тесты не должны слать статистику
  // (в т.ч. webvisor-сессии на реальный счётчик). Стаб держит транспорт
  // «готовым» для фасада; analytics.spec перехватывает присваивание
  // своей ловушкой и получает рекордер вместо noop.
  if (process.env.NODE_ENV !== 'production') {
    return (
      <Script id="ym-e2e-stub" strategy="afterInteractive">
        {`window.ym = window.ym || function(){};`}
      </Script>
    );
  }

  return (
    <>
      <Script id="yandex-metrica-init" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          ym(${YANDEX_METRICA_ID}, "init", {
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRICA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
