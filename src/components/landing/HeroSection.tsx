'use client';

import { useEffect, useState } from 'react';
import HUDOverlay from './HUDOverlay';
import CTAButton from './CTAButton';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className }: HeroSectionProps) {
  const [showText, setShowText] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => setShowText(true), 300);
    const ctaTimer = setTimeout(() => setShowCTA(true), 800);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(ctaTimer);
    };
  }, []);

  return (
    <section
      className={cn(
        'relative flex flex-col overflow-hidden',
        // Mobile: smaller min-height to fit content
        'min-h-[85vh] md:min-h-screen',
        'items-center justify-center px-3 md:px-8 py-4 md:py-0',
        className
      )}
      style={{
        backgroundImage: "url('/images/hero-art.jpg')",
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

      {/* Content - tighter spacing on mobile */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-2 text-center">
        {/* Main title - smaller on mobile */}
        <h1
          className={cn(
            'font-russo font-black',
            // Responsive: 3xl on mobile, 5xl on tablet, 7xl on desktop
            'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
            'military-text-gradient',
            'mb-2 md:mb-4 lg:mb-6',
            'tracking-wide transition-all duration-700',
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          БРОНЕПЕХОТА
        </h1>

        {/* Subtitle - smaller and condensed on mobile */}
        <p
          className={cn(
            'font-ibm-mono',
            // Responsive: 10px on mobile, base on tablet+
            'text-[10px] sm:text-xs md:text-sm lg:text-base',
            'text-military-amber/80',
            'tracking-[0.15em] md:tracking-widest',
            'uppercase',
            'mb-3 md:mb-6 lg:mb-8',
            'transition-all duration-700 delay-75',
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Тактический помощник для варгейма
        </p>

        {/* Lore description - collapsed on mobile, expanded on larger screens */}
        <div
          className={cn(
            'mx-auto mb-6 md:mb-10 lg:mb-14',
            'max-w-full md:max-w-2xl',
            'transition-all duration-700 delay-150',
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Desktop+: Full version */}
          <p className="border-l-2 md:border-l-4 border-military-rust/60 pl-3 md:pl-6 italic font-oswald text-military-sand text-xs sm:text-sm md:text-base leading-snug md:leading-relaxed hidden md:block">
            Несмотря на прекращение огня, сражения не прекратились полностью. Спорадические
            битвы между силами Империи и Протектората все еще происходили на планетах по всему
            Доминиону. Но миру не суждено было продолжиться. Империя снова возобновила вторжения,
            а Протекторат продолжил организовывать восстания. Флоты космических кораблей сталкивались
            в черноте космоса, и бои шли на сотнях планет. Исход еще должен быть определён.
            Пришло время новым командирам взять под контроль армии. Только одна сторона станет
            победителем. <span className="text-military-amber font-semibold">Кто это будет?</span>
          </p>
          {/* Mobile: Medium version */}
          <p className="border-l-2 border-military-rust/60 pl-3 italic font-oswald text-military-sand text-xs leading-snug md:hidden">
            Несмотря на перемирие, сражения не прекратились. Спорадические битвы между
            Империей и Протекторатом происходили по всему Доминиону. Империя возобновила
            вторжения, Протекторат организовал восстания. Флоты сталкивались в космосе,
            бои шли на сотнях планет. Исход должен быть определён.
            <br/>
            Пришло время новым командирам взять под контроль армии.
            Только одна сторона станет победителем.
            <br/>
            <span className="text-military-amber font-semibold">Кто это будет?</span>
          </p>
        </div>

        {/* CTA Button */}
        <div
          className={cn(
            'transition-all duration-700 delay-200',
            showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <CTAButton />
        </div>

        {/* Encyclopedia link */}
        <div
          className={cn(
            'mt-4 md:mt-6',
            'transition-all duration-700 delay-300',
            showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <a
            href="/encyclopedia"
            data-testid="encyclopedia-link"
            className="font-ibm-mono text-xs md:text-sm text-military-rust/60 hover:text-military-amber transition-colors duration-200 tracking-widest uppercase"
          >
            Энциклопедия отрядов и техники
          </a>
        </div>
      </div>

      {/* Scroll indicator - hidden on very small screens */}
      <div
        className={cn(
          'absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2',
          'flex flex-col items-center gap-1 md:gap-2 text-military-rust/60',
          'transition-all duration-700 delay-300',
          'hidden sm:flex',
          showCTA ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span className="font-ibm-mono text-[9px] md:text-[10px] tracking-widest">SCROLL</span>
        <div className="w-px h-6 md:h-8 bg-gradient-to-b from-military-rust to-transparent animate-pulse" />
      </div>
    </section>
  );
}
