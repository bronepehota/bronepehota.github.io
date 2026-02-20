'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FinalCTAProps {
  className?: string;
}

export default function FinalCTA({ className }: FinalCTAProps) {

  return (
    <section
      className={cn(
        'relative py-20 md:py-32 px-4 md:px-8 overflow-hidden',
        'bg-military-dark',
        className
      )}
    >
      {/* Background effects */}
      <div className="absolute inset-0 diagonal-stripes opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-military-charcoal via-transparent to-military-dark" />

      {/* Radar effect in corner */}
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full border-2 border-military-rust/30 rounded-full radar-scan" />
          <div className="absolute w-3/4 h-3/4 border border-military-rust/20 rounded-full" />
          <div className="absolute w-1/2 h-1/2 border border-military-rust/10 rounded-full" />
          <div className="absolute w-1 h-1/2 bg-gradient-to-t from-military-rust to-transparent origin-bottom radar-scan" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          {/* Atmospheric lore text */}
          <div className="mb-10 md:mb-16">
            <blockquote className="font-oswald text-lg md:text-xl text-military-taupe leading-relaxed italic border-l-4 border-military-rust pl-6 text-left">
              Пришло время выбрать сторону. Империя обещает порядок и силу. Протекторат
              предлагает свободу и процветание. Наёмники служат тем, кто платит.
              Но в конце концов, победителей судят только по результату.
            </blockquote>
          </div>

          {/* CTA heading */}
          <h2 className="font-russo font-black text-3xl md:text-5xl lg:text-6xl military-text-gradient mb-6 md:mb-8">
            НАЧНИ БОЙ
          </h2>

          {/* Subtitle */}
          <p className="font-oswald text-base md:text-lg text-military-taupe mb-10 md:mb-12 max-w-2xl mx-auto">
            Собери свою армию. Выбери тактику. Одержи победу.
          </p>

          {/* CTA Button */}
          <Link
            href="/app"
            data-testid="final-cta-button"
            className={cn(
              'inline-flex',
              'no-underline',
              'group relative px-10 py-5 bg-military-rust',
              'border-2 border-military-rust hover:border-military-amber',
              'font-russo font-bold text-lg md:text-xl uppercase tracking-widest text-white',
              'transition-all duration-300',
              'overflow-hidden touch-manipulation min-h-[60px]',
              'hover:shadow-[0_0_30px_rgba(234,88,12,0.4)]'
            )}
          >
            {/* Button background overlay */}
            <span className="absolute inset-0 bg-gradient-to-r from-military-red via-military-rust to-military-red opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/50" />
            <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/50" />
            <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/50" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/50" />

            {/* Button content */}
            <span className="relative flex items-center gap-3">
              ПЕРЕЙТИ В ШТАБ
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>

            {/* Shine effect */}
            <span className="absolute inset-0 overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:animate-shine" />
            </span>
          </Link>

          {/* Technical decoration below button */}
          <div className="mt-8 flex items-center justify-center gap-4 font-ibm-mono text-xs text-military-steel/60">
            <span>SYSTEM_READY</span>
            <span className="w-px h-4 bg-military-steel/40" />
            <span>AWAITING_COMMAND</span>
            <span className="w-px h-4 bg-military-steel/40" />
            <span className="w-2 h-2 bg-military-rust rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom scanline */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/50 to-transparent" />
    </section>
  );
}
