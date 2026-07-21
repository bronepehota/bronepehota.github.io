'use client';

import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContributeButton } from './AttributionLabel';

/** localStorage flag — once dismissed, the banner never returns. */
const DISMISS_KEY = 'bronepehota_encyclopedia_sources_banner_dismissed';

/**
 * First-visit "field memo" explaining the encyclopedia mixes official Tehnolog
 * canon with community (Star System) material, with a one-tap «Дополнить» that
 * copies a message template and opens VK. Dossier aesthetic to match the app.
 */
export function EncyclopediaAttributionBanner() {
  // Start hidden so static-export prerender + first client render agree (no flash);
  // reveal after mount unless previously dismissed.
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) !== '1') setShow(true);
    } catch {
      setShow(true); // localStorage blocked — just show it
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <aside
      data-testid="encyclopedia-sources-banner"
      className={cn(
        'relative folded-paper military-corners overflow-hidden',
        'border border-military-amber/25 bg-military-charcoal/50',
        'fade-in-up',
      )}
    >
      {/* amber side rail */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-military-amber/70 via-military-rust/40 to-transparent" />
      <div className="relative flex items-start gap-3 p-4 md:gap-4 md:p-5">
        {/* icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-military-amber/40 bg-military-amber/10">
          <Info className="h-4 w-4 text-military-amber" aria-hidden />
        </div>

        {/* body */}
        <div className="min-w-0 flex-1">
          <h2 className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-rust/80">
            {'// О ИСТОЧНИКАХ ДАННЫХ'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-military-sand/80">
            Энциклопедия собрана из разнородных источников: официального лора Технолога немного,
            значительная часть — фанатские работы сообщества Star System. Нашли ошибку или есть
            чем дополнить — нажмите{' '}
            <span className="font-oswald text-military-amber">«Дополнить»</span>: скопируем
            шаблон сообщения и откроем VK, останется вставить и отправить.
          </p>
          <div className="mt-3">
            <ContributeButton subject="Энциклопедия" />
          </div>
        </div>

        {/* dismiss */}
        <button
          type="button"
          onClick={dismiss}
          data-testid="encyclopedia-sources-banner-dismiss"
          aria-label="Закрыть сообщение"
          className="shrink-0 rounded-sm p-1 text-military-steel/60 transition-colors hover:text-military-amber"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
