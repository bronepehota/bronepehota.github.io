'use client';

import { Github, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'relative bg-slate-900/90 border-t border-slate-800',
        'px-4 py-2 md:py-4',
        className
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-hud-green/30" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-hud-green/30" />

      <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
        {/* Links row */}
        <div className="flex flex-row items-center justify-between gap-2 md:gap-4 w-full">
          {/* Encyclopedia link */}
          <Link
            href="/encyclopedia"
            data-testid="encyclopedia-link"
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-sm border border-slate-700/50 hover:border-military-amber/50 transition-all duration-300 group touch-manipulation whitespace-nowrap"
          >
            <span className="font-russo text-[10px] md:text-xs text-slate-400 group-hover:text-military-amber transition-colors">
              ЭНЦИКЛОПЕДИЯ
            </span>
          </Link>

          {/* Chronicles link — wars section of the encyclopedia history */}
          <Link
            href="/encyclopedia/history"
            data-testid="campaigns-link"
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-sm border border-slate-700/50 hover:border-military-amber/50 transition-all duration-300 group touch-manipulation whitespace-nowrap"
          >
            <span className="font-russo text-[10px] md:text-xs text-slate-400 group-hover:text-military-amber transition-colors">
              ХРОНИКИ
            </span>
          </Link>

          {/* Editor link */}
          <Link
            href="/editor"
            data-testid="editor-link"
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-sm border border-slate-700/50 hover:border-hud-green/50 transition-all duration-300 group touch-manipulation whitespace-nowrap"
          >
            <span className="font-russo text-[10px] md:text-xs text-slate-400 group-hover:text-hud-green transition-colors">
              РЕДАКТОР
            </span>
          </Link>

          {/* External links group */}
          <div className="flex items-center gap-2">
            {/* VK community link */}
            <a
              href="https://vk.com/lastbpcoder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-sm border border-slate-700/50 hover:border-blue-400/50 transition-all duration-300 group touch-manipulation whitespace-nowrap"
            >
              <span className="font-russo text-[10px] md:text-xs text-slate-400 group-hover:text-blue-400 transition-colors">
                VK
              </span>
            </a>

            {/* GitHub link */}
            <a
              href="https://github.com/bronepehota/bronepehota.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1.5 rounded-sm border border-hud-slate-light/30 hover:border-hud-green/50 transition-all duration-300 group touch-manipulation"
            >
              <Github className="w-3 h-3 md:w-4 md:h-4 text-slate-400 group-hover:text-hud-green transition-colors" />
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce flex flex-col items-center gap-0.5 text-slate-500/40">
          <ChevronDown className="w-4 h-4" />
          <span className="text-[8px] tracking-widest">ЛИСТАЙТЕ</span>
        </div>
      </div>

      {/* Scanline effect at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-hud-green/20 to-transparent" />
    </footer>
  );
}
