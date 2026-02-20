'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTAButtonProps {
  className?: string;
}

export default function CTAButton({ className }: CTAButtonProps) {
  return (
    <Link
      href="/app"
      data-testid="landing-cta-button"
      className={cn(
        'group relative inline-flex',
        // Responsive padding and sizing
        'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4',
        'bg-transparent',
        'border-2 border-military-rust/60',
        // Responsive font size
        'font-russo font-bold text-sm sm:text-base md:text-lg',
        'uppercase tracking-wider md:tracking-widest',
        'text-military-rust',
        'hover:border-military-amber hover:text-military-amber transition-all duration-300',
        'overflow-hidden touch-manipulation',
        // Responsive min-height for touch target
        'min-h-[44px] md:min-h-[56px]',
        'hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]',
        // Remove default link styles
        'no-underline',
        className
      )}
    >
      {/* Button background overlay */}
      <span className="absolute inset-0 bg-military-rust/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

      {/* Corner accents - responsive size */}
      <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-military-rust" />
      <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-military-rust" />
      <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-military-rust" />
      <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-military-rust" />

      {/* Button content - responsive icon and gap */}
      <span className="relative flex items-center gap-2 md:gap-3">
        <span className="hidden sm:inline">ПЕРЕЙТИ В ШТАБ</span>
        <span className="sm:hidden">В ШТАБ</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
      </span>

      {/* Scanline effect on hover */}
      <span className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-military-rust/20 to-transparent transform -translate-x-full group-hover:animate-shine" />
      </span>
    </Link>
  );
}
