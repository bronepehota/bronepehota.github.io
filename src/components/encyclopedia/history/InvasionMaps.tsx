'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BASE_PATH } from '@/lib/constants';
import { getCredit } from '@/lib/painted-images';
import {
  INVASION_MAPS,
  INVASION_MAPS_CREDIT_ID,
  type InvasionMap,
} from '@/lib/invasion-maps';
import { cn } from '@/lib/utils';

/**
 * «// КАРТЫ ТЕАТРОВ ВОЙН» — серия политико-военных карт вселенной («СтарСис»,
 * Звёздные Системы). На хабе Истории живёт переключателем периодов (одна
 * карта в кадре — страница и так длинная); в кампании волн та же карта
 * рендерится одиночной фигурой (`MapFigure`). Небыстрые карты грузятся
 * лениво — в кадре изначально только активный период.
 */

function MapFigure({ map, eager }: { map: InvasionMap; eager?: boolean }) {
  const credit = getCredit(INVASION_MAPS_CREDIT_ID);
  return (
    <figure data-testid="invasion-map-figure" className="m-0">
      <div className="border border-military-steel/30 bg-military-charcoal/40 p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- статический экспорт: unoptimized <img> с ручным BASE_PATH */}
        <img
          src={`${BASE_PATH}/images/maps/${map.slug}.jpg`}
          alt={`${map.title} (${map.years}) — карта театров войн вселенной СтарСис`}
          data-testid="invasion-map-img"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width={2048}
          height={1443}
          className="block w-full h-auto"
        />
      </div>
      <figcaption className="mt-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-oswald text-sm text-military-sand uppercase tracking-wide">
            {map.title}
          </span>
          <span className="font-ibm-mono text-[10px] text-military-taupe/80 tracking-wider">
            {map.years}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-military-taupe/80">
          {map.note}
        </p>
        {/* Связи канона: кампании и досье периода */}
        {(map.related.campaigns.length > 0 || map.related.world.length > 0) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-ibm-mono text-[10px] uppercase tracking-wide">
            {map.related.campaigns.map((c) => (
              <Link
                key={c.slug}
                href={`/campaigns/${c.slug}`}
                className="text-military-amber/90 hover:text-military-amber transition-colors"
              >
                {`→ ${c.label}`}
              </Link>
            ))}
            {map.related.world.map((w) => (
              <Link
                key={w.slug}
                href={`/encyclopedia/world/${w.slug}`}
                className="text-military-amber/90 hover:text-military-amber transition-colors"
              >
                {`→ ${w.label}`}
              </Link>
            ))}
          </p>
        )}
        {/* Кредит серии — лого автора (вшит и в сам водяной знак карты) */}
        {credit && (
          <p className="mt-2 flex items-center gap-2 font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-taupe/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={credit.logo ? `${BASE_PATH}${credit.logo}` : ''}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 rounded-sm object-contain border border-military-steel/30"
            />
            <span>{'// КАРТА:'}</span>
            <a
              href={credit.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="invasion-map-credit"
              className="text-military-amber/90 hover:text-military-amber transition-colors"
            >
              {credit.name.toUpperCase()} ↗
            </a>
          </p>
        )}
      </figcaption>
    </figure>
  );
}

export function InvasionMapsGallery() {
  const [active, setActive] = useState(INVASION_MAPS[0].slug);
  const current = INVASION_MAPS.find((m) => m.slug === active) ?? INVASION_MAPS[0];

  return (
    <section
      aria-label="Карты театров войн"
      data-testid="invasion-maps"
      className="folded-paper military-corners px-4 py-4 md:px-5 md:py-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3 pb-2.5 border-b border-military-steel/20">
        <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80">
          {'// КАРТЫ ТЕАТРОВ ВОЙН'}
        </p>
        <p className="font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-taupe/80">
          пять периодов · одна вселенная
        </p>
      </div>

      {/* Переключатель периодов: годы — по возрастанию фронта */}
      <div
        role="tablist"
        aria-label="Период карты"
        className="flex flex-wrap gap-1.5 mb-3"
      >
        {INVASION_MAPS.map((m) => {
          const isActive = m.slug === active;
          return (
            <button
              key={m.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid="invasion-map-tab"
              onClick={() => setActive(m.slug)}
              className={cn(
                'rounded-sm border px-2.5 py-1 font-ibm-mono text-[10px] tracking-wider transition-colors touch-manipulation',
                isActive
                  ? 'border-military-amber/60 bg-military-amber/15 text-military-amber'
                  : 'border-military-steel/30 text-military-taupe/80 hover:border-military-amber/40 hover:text-military-sand',
              )}
            >
              {m.years}
            </button>
          );
        })}
      </div>

      <MapFigure map={current} eager />

      {/* Предзагрузка остальных периодов: скрытые eager-<img> (lazy в display:none
          не грузится) — переключение занимает один кадр, не сеть. */}
      <div hidden aria-hidden>
        {INVASION_MAPS.filter((m) => m.slug !== active).map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.slug}
            src={`${BASE_PATH}/images/maps/${m.slug}.jpg`}
            alt=""
            loading="eager"
            decoding="async"
          />
        ))}
      </div>
    </section>
  );
}

/** Одиночная фигура карты для тела кампании (без переключателя). */
export function CampaignMapFigure({ mapSlug }: { mapSlug: string }) {
  const map = INVASION_MAPS.find((m) => m.slug === mapSlug);
  if (!map) return null;
  return (
    <div className="mt-5">
      <MapFigure map={map} eager />
    </div>
  );
}

/**
 * Витрина «// ТЕАТРЫ ВОЙН» для хаба «Архив вселенной»: карта РЯДОМ с описанием
 * периода (на мобиле — описание над картой). Табы-годы переключают пару целиком;
 * под картой — проход в полную галерею на хабе Истории (#maps).
 */
export function InvasionMapShowcase() {
  const [active, setActive] = useState(INVASION_MAPS[0].slug);
  const current = INVASION_MAPS.find((m) => m.slug === active) ?? INVASION_MAPS[0];
  const credit = getCredit(INVASION_MAPS_CREDIT_ID);

  return (
    <section
      aria-label="Театры войн вселенной"
      data-testid="invasion-showcase"
      className="folded-paper military-corners px-4 py-4 md:px-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3 pb-2.5 border-b border-military-steel/20">
        <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80">
          {'// ТЕАТРЫ ВОЙН'}
        </p>
        <p className="font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-taupe/80">
          карта + период
        </p>
      </div>

      {/* Пара: описание слева, карта справа (мобильный — стопкой) */}
      <div className="grid gap-4 md:grid-cols-[5fr,6fr] md:items-start">
        <div data-testid="invasion-showcase-text">
          <h2 className="font-oswald text-lg md:text-xl text-military-sand uppercase tracking-wide">
            {current.title}
          </h2>
          <p className="mt-0.5 font-ibm-mono text-[10px] text-military-amber tracking-wider">
            {current.years}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-military-taupe">
            {current.description}
          </p>
          {(current.related.campaigns.length > 0 || current.related.world.length > 0) && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-ibm-mono text-[10px] uppercase tracking-wide">
              {current.related.campaigns.map((c) => (
                <Link
                  key={c.slug}
                  href={`/campaigns/${c.slug}`}
                  className="text-military-amber/90 hover:text-military-amber transition-colors"
                >
                  {`→ ${c.label}`}
                </Link>
              ))}
              {current.related.world.map((w) => (
                <Link
                  key={w.slug}
                  href={`/encyclopedia/world/${w.slug}`}
                  className="text-military-amber/90 hover:text-military-amber transition-colors"
                >
                  {`→ ${w.label}`}
                </Link>
              ))}
            </p>
          )}
          {credit && (
            <p className="mt-3 flex items-center gap-2 font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-taupe/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={credit.logo ? `${BASE_PATH}${credit.logo}` : ''}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-sm object-contain border border-military-steel/30"
              />
              <span>{'// КАРТА:'}</span>
              <a
                href={credit.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="invasion-map-credit"
                className="text-military-amber/90 hover:text-military-amber transition-colors"
              >
                {credit.name.toUpperCase()} ↗
              </a>
            </p>
          )}
        </div>

        <figure className="m-0">
          <div className="border border-military-steel/30 bg-military-charcoal/40 p-1.5">
            {/* Статический экспорт: unoptimized <img> с ручным BASE_PATH. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE_PATH}/images/maps/${current.slug}.jpg`}
              alt={`${current.title} (${current.years}) — карта театров войн вселенной СтарСис`}
              data-testid="invasion-map-img"
              loading="eager"
              decoding="async"
              width={2048}
              height={1443}
              className="block w-full h-auto"
            />
          </div>
          <Link
            href="/encyclopedia/history#maps"
            className="mt-2 inline-block font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-taupe/80 hover:text-military-amber transition-colors"
          >
            {'// ВСЕ ПЯТЬ КАРТ →'}
          </Link>
        </figure>
      </div>

      {/* Переключатель периодов */}
      <div role="tablist" aria-label="Период театра войн" className="flex flex-wrap gap-1.5 mt-4">
        {INVASION_MAPS.map((m) => {
          const isActive = m.slug === active;
          return (
            <button
              key={m.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid="invasion-map-tab"
              onClick={() => setActive(m.slug)}
              className={cn(
                'rounded-sm border px-2.5 py-1 font-ibm-mono text-[10px] tracking-wider transition-colors touch-manipulation',
                isActive
                  ? 'border-military-amber/60 bg-military-amber/15 text-military-amber'
                  : 'border-military-steel/30 text-military-taupe/80 hover:border-military-amber/40 hover:text-military-sand',
              )}
            >
              {m.years}
            </button>
          );
        })}
      </div>

      {/* Предзагрузка остальных периодов (lazy в display:none не грузится) */}
      <div hidden aria-hidden>
        {INVASION_MAPS.filter((m) => m.slug !== active).map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.slug}
            src={`${BASE_PATH}/images/maps/${m.slug}.jpg`}
            alt=""
            loading="eager"
            decoding="async"
          />
        ))}
      </div>
    </section>
  );
}

export default InvasionMapsGallery;
