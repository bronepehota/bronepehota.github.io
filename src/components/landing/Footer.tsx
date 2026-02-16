'use client';

import { Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'relative bg-slate-900/90 border-t border-slate-800',
        'px-4 py-3 md:py-4',
        className
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-hud-green/30" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-hud-green/30" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status indicators */}
        <div className="flex items-center gap-4 font-orbitron text-[10px] text-hud-green/60 hud-text">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-hud-green rounded-full animate-pulse" />
            <span>SYSTEM: ONLINE</span>
          </div>
          <div className="hidden md:block">|</div>
          <div className="hidden md:block">BUILD: 2025.02</div>
        </div>

        {/* Encyclopedia link */}
        <a
          href="/encyclopedia"
          data-testid="encyclopedia-link"
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-slate-700/50 hover:border-military-amber/50 transition-all duration-300 group touch-manipulation min-h-[44px]"
        >
          <span className="font-russo text-xs text-slate-400 group-hover:text-military-amber transition-colors">
            ЭНЦИКЛОПЕДИЯ
          </span>
        </a>

        {/* GitHub link */}
        <a
          href="https://github.com/Luxor/bronepehota"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-hud-slate-light/30 hover:border-hud-green/50 transition-all duration-300 group touch-manipulation min-h-[44px]"
        >
          <Github className="w-4 h-4 text-slate-400 group-hover:text-hud-green transition-colors" />
          <span className="font-orbitron text-xs text-slate-400 group-hover:text-hud-green transition-colors hud-text">
            ПОМОЧЬ С ПРОЕКТОМ
          </span>
        </a>

        {/* Version info */}
        <div className="flex items-center gap-4 font-orbitron text-[10px] text-slate-500 hud-text">
          <div>BRONEPEHOTA v2.0</div>
          <div className="hidden md:block">© 2025</div>
        </div>
      </div>

      {/* Scanline effect at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-hud-green/20 to-transparent" />
    </footer>
  );
}
