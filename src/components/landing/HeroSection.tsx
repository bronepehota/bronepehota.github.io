'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HUDOverlay from './HUDOverlay';
import CTAButton from './CTAButton';
import { cn } from '@/lib/utils';
import { BASE_PATH } from '@/lib/constants';

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className }: HeroSectionProps) {
  const [showText, setShowText] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => setShowText(true), 200);
    const ctaTimer = setTimeout(() => setShowCTA(true), 500);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(ctaTimer);
    };
  }, []);

  return (
    <section
      className={cn(
        'relative flex flex-col flex-1 overflow-hidden',
        'items-center justify-center px-3 md:px-8 py-4 md:py-6',
        className
      )}
      style={{
        backgroundImage: `url('${BASE_PATH}/images/landing-hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Mild global darkening — the battlefield stays visible (was 90-95%, drowned the image) */}
      <div className="absolute inset-0 bg-military-dark/55" />

      {/* Warm fire glow from lower-left (matches the promo's fire) + faint cool top-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(62% 55% at 12% 82%, rgba(234,88,12,0.32), transparent 62%), radial-gradient(45% 40% at 88% 16%, rgba(202,166,74,0.12), transparent 60%)',
        }}
      />

      {/* Legibility scrim behind the centered text block */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-full max-w-3xl h-[72%]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(12,10,9,0.80) 0%, rgba(12,10,9,0.38) 46%, transparent 72%)',
          }}
        />
      </div>

      {/* Vignette — pull focus to the center, darken edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 36%, rgba(12,10,9,0.62) 100%)' }}
      />

      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain opacity-15 pointer-events-none" />

      {/* HUD Overlay */}
      <HUDOverlay />

      {/* Content - more compact */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-2 text-center">
        {/* Main title - more responsive sizes */}
        <h1
          className={cn(
            'font-russo font-black',
            // Tighter responsive sizes: 2xl -> 4xl -> 6xl
            'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
            'military-text-gradient',
            'drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]',
            'mb-1 md:mb-2 lg:mb-3',
            'tracking-wide transition-all duration-700',
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          БРОНЕПЕХОТА
        </h1>

        {/* Subtitle - more compact */}
        <p
          className={cn(
            'font-ibm-mono',
            // Smaller sizes: 9px -> 10px -> 12px -> 14px
            'text-[9px] sm:text-[10px] md:text-xs lg:text-sm',
            'text-military-amber/80',
            'tracking-[0.1em] md:tracking-[0.15em]',
            'uppercase',
            'mb-2 md:mb-3 lg:mb-4',
            'transition-all duration-700 delay-75',
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Неофициальный проект по настольному варгейму «Бронепехота» (© Технолог)
        </p>

        {/* Tehnolog credit — logo + link to official site */}
        <a
          href="https://www.tehnolog.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mb-2 transition-opacity hover:opacity-80"
        >
          <img
            src={`${BASE_PATH}/images/credits/tehnolog.png`}
            alt="Технолог"
            className="h-4 w-4 rounded-sm"
          />
          <span className="font-ibm-mono text-[8px] sm:text-[9px] text-military-steel/50 tracking-wide">
            Игра: tehnolog.ru
          </span>
        </a>

        {/* Lore description */}
        <div
          className={cn(
            'mx-auto mb-3 md:mb-5 lg:mb-6',
            'max-w-full md:max-w-xl',
            'transition-all duration-700 delay-100',
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <p className="border-l-2 md:border-l-3 border-military-rust/50 pl-2 md:pl-4 italic font-oswald text-military-sand text-[10px] sm:text-xs md:text-sm leading-snug">
            Несмотря на перемирие, сражения не прекратились. Спорадические битвы между
            Империей и Протекторатом происходили по всему Доминиону. Флоты сталкивались в космосе,
            бои шли на сотнях планет. Исход должен быть определён.
            <span className="text-military-amber font-semibold"> Кто победит?</span>
          </p>
        </div>

        {/* CTA Button */}
        <div
          className={cn(
            'transition-all duration-700 delay-150',
            showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <CTAButton />
        </div>

        {/* GitHub help link */}
        <div
          className={cn(
            'transition-all duration-700 delay-200',
            showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Link
            href="https://vk.com/lastbpcoder"
            target="_blank"
            rel="noopener noreferrer"
            className="font-ibm-mono text-[9px] md:text-xs text-military-rust/50 hover:text-military-amber transition-colors duration-200 tracking-widest uppercase"
          >
            Помочь с проектом
          </Link>
        </div>
      </div>
    </section>
  );
}
