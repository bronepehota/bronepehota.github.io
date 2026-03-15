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
        backgroundImage: `url('${BASE_PATH}/images/hero-art.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-military-dark/95 via-military-charcoal/90 to-military-dark/95" />

      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />

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
          Тактический помощник для варгейма
        </p>

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
            href="https://github.com/Luxor/bronepehota"
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
