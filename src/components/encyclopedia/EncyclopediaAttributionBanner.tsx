'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Megaphone } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bronepehota_sources_legend_expanded';

/**
 * Collapsible legend explaining the provenance badges on unit cards.
 * Collapsed: compact row with credit logos + «Дополнить» button.
 * Expanded: detailed explanation of official vs fan content, what the card badges mean.
 * State persisted in localStorage.
 */
export function EncyclopediaAttributionBanner() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* localStorage unavailable — default collapsed */
    }
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <aside
      data-testid="encyclopedia-sources-banner"
      className="rounded border border-military-steel/30 bg-military-charcoal/40 overflow-hidden"
    >
      {/* Compact header — always visible */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
        {/* Tehnolog — official */}
        <div className="flex items-center gap-1.5">
          <div className="relative h-5 w-5 overflow-hidden rounded-sm shrink-0 border border-cyan-500/30">
            <GitHubPagesImage src="/images/credits/tehnolog.png" alt="Технолог" fill className="object-contain" />
          </div>
          <span className="font-ibm-mono text-[10px] text-military-sand/70">
            Официальный канон (Технолог)
          </span>
        </div>

        {/* АВБ — alternative-version marking on all community content */}
        <div className="flex items-center gap-1.5">
          <div className="relative h-5 w-5 overflow-hidden rounded-sm shrink-0 border border-emerald-500/30">
            <GitHubPagesImage src="/images/credits/avb.svg" alt="АВБ" fill className="object-contain" />
          </div>
          <span className="font-ibm-mono text-[10px] text-military-sand/70">
            АВБ — альтернативная версия
          </span>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label="Подробнее об источниках"
          className="font-ibm-mono text-[9px] uppercase tracking-wider text-military-rust/50 transition-colors hover:text-military-amber ml-auto inline-flex items-center gap-1"
        >
          Подробнее
          <ChevronDown className={cn('h-3 w-3 transition-transform duration-300', expanded && 'rotate-180')} />
        </button>

        {/* Дополнить */}
        <a
          href="https://vk.ru/lastbpcoder"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-sm border border-military-amber/40 bg-military-amber/10 px-2 py-0.5 font-ibm-mono text-[10px] text-military-amber transition-colors hover:bg-military-amber/20"
        >
          <Megaphone className="h-3 w-3" />
          Дополнить
        </a>
      </div>

      {/* Expandable details — conditional render for reliability */}
      {expanded && (
        <div className="border-t border-military-steel/20 px-3 py-3 space-y-2.5">
          {/* Official */}
          <div className="flex items-start gap-2">
            <div className="relative mt-0.5 h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-cyan-500/30">
              <GitHubPagesImage src="/images/credits/tehnolog.png" alt="Технолог" fill className="object-contain" />
            </div>
            <div>
              <p className="font-ibm-mono text-[10px] uppercase tracking-wider text-cyan-400/80 mb-0.5">
                Официальный канон
              </p>
              <p className="text-[11px] leading-relaxed text-military-taupe/70">
                Материалы от компании «Технолог» — официальные правила, книги, карточки отрядов.
                Это исходный канон вселенной Бронепехоты.
              </p>
            </div>
          </div>

          {/* АВБ — alternative-version marking */}
          <div className="flex items-start gap-2">
            <div className="relative mt-0.5 h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-emerald-500/30">
              <GitHubPagesImage src="/images/credits/avb.svg" alt="АВБ" fill className="object-contain" />
            </div>
            <div>
              <p className="font-ibm-mono text-[10px] uppercase tracking-wider text-emerald-400/80 mb-0.5">
                АВБ — Альтернативная Версия Бронепехоты
              </p>
              <p className="text-[11px] leading-relaxed text-military-taupe/70">
                Альтернативная Версия Бронепехоты — общая маркировка всех неофициальных материалов
                (отряды, лор и миниатюры от «Звёздных Систем», «Миниатюр Лисицина», «Мёртвого Флота»
                и других авторов). Она не является заменой оригинальным миниатюрам «Технолога», а даёт
                возможность разнообразить игровой и коллекционный опыт и расширить вселенную «Бронепехоты».
                Метка АВБ по умолчанию появляется рядом с источником любого фанатского контента.
              </p>
            </div>
          </div>

          {/* Card badges explanation */}
          <p className="text-[11px] leading-relaxed text-military-steel/50 border-t border-military-steel/15 pt-2">
            В углу каждой карточки отряда — лого источника: Технолог для официального контента,
            лого конкретного сообщества («Миниатюры Лисицина», «Звёздные Системы» и т.д.) — для неофициального.
            На странице отряда — подробные метки источников и авторов, а метка АВБ отмечает весь неофициальный контент.
          </p>
        </div>
      )}
    </aside>
  );
}
