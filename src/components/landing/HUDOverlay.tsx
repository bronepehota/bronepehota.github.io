'use client';

import { cn } from '@/lib/utils';

interface HUDOverlayProps {
  className?: string;
}

export default function HUDOverlay({ className }: HUDOverlayProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {/* Corner brackets - smaller on mobile but always visible */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-16 sm:h-16 border-l-2 border-t-2 border-military-rust/40" />
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-16 sm:h-16 border-r-2 border-t-2 border-military-rust/40" />
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-8 h-8 sm:w-16 sm:h-16 border-l-2 border-b-2 border-military-rust/40" />
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-16 sm:h-16 border-r-2 border-b-2 border-military-rust/40" />

      {/* Inner corner accents - smaller on mobile */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 w-4 h-4 sm:w-8 sm:h-8 border-l border-t border-military-amber/30" />
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 w-4 h-4 sm:w-8 sm:h-8 border-r border-t border-military-amber/30" />
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 w-4 h-4 sm:w-8 sm:h-8 border-l border-b border-military-amber/30" />
      <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 w-4 h-4 sm:w-8 sm:h-8 border-r border-b border-military-amber/30" />

      {/* Scanning line - always visible */}
      <div className="scanline opacity-60 sm:opacity-100" />

      {/* Horizontal tactical lines */}
      <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/20 to-transparent" />
      <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/20 to-transparent" />

      {/* Vertical tactical lines */}
      <div className="absolute top-0 left-1/4 bottom-0 w-px bg-gradient-to-b from-transparent via-military-steel/10 to-transparent" />
      <div className="absolute top-0 left-3/4 bottom-0 w-px bg-gradient-to-b from-transparent via-military-steel/10 to-transparent" />

      {/* Status indicators - top left - smaller on mobile */}
      <div className="absolute top-3 left-12 sm:top-4 sm:left-24 font-ibm-mono text-[8px] sm:text-[10px] text-military-rust">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-military-rust rounded-full animate-pulse-slow" />
          <span className="hidden sm:inline">STATUS:</span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* Coordinates - top right - hidden on very small screens */}
      <div className="absolute top-3 right-12 sm:top-4 sm:right-24 font-ibm-mono text-[8px] sm:text-[10px] text-military-taupe/80">
        <div>COORDS: 45.9123</div>
        <div className="hidden sm:block">SECTOR: ALPHA-7</div>
      </div>

      {/* Bottom status - left - compact on mobile */}
      <div className="absolute bottom-3 left-12 sm:bottom-4 sm:left-24 font-ibm-mono text-[8px] sm:text-[10px] text-military-taupe/80">
        <div>UNIT: COMMAND</div>
        <div className="hidden sm:block">VER: 2.4.1</div>
      </div>

      {/* Classification marker - right - compact on mobile */}
      <div className="absolute bottom-3 right-12 sm:bottom-4 sm:right-24 font-ibm-mono text-[8px] sm:text-[10px] text-military-amber/70">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="animate-blink">▶</span>
          <span className="hidden sm:inline">CLASSIFIED</span>
          <span className="sm:hidden">CLS</span>
        </div>
      </div>

      {/* Crosshairs - moved to bottom left corner */}
      <div className="absolute bottom-20 left-4 sm:bottom-24 sm:left-8 opacity-10">
        <div className="w-16 h-16 sm:w-24 sm:h-24 border border-military-rust rounded-full" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-military-rust transform -translate-y-1/2" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-military-rust transform -translate-x-1/2" />
      </div>

      {/* Second crosshair - top right corner */}
      <div className="absolute top-16 right-4 sm:top-20 sm:right-8 opacity-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border border-military-steel/50 rounded-sm" />
        <div className="absolute top-1/2 left-1/4 w-1/2 h-px bg-military-steel/30" />
        <div className="absolute top-1/4 left-1/2 w-px h-1/2 bg-military-steel/30" />
      </div>

      {/* Pulsing dots - always visible */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-military-rust rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-military-rust rounded-full animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-military-rust rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-military-rust rounded-full animate-pulse-slow" />

      {/* Additional tactical dots along edges */}
      <div className="absolute top-1/2 left-0 w-2 h-2 bg-military-rust/30 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-0 w-2 h-2 bg-military-rust/30 rounded-full animate-pulse" />
      <div className="absolute top-0 left-1/2 w-2 h-2 bg-military-rust/30 rounded-full animate-pulse-slow" />
      <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-military-rust/30 rounded-full animate-pulse-slow" />

      {/* Technical data blocks - compact on mobile */}
      <div className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 font-ibm-mono text-[6px] sm:text-[8px] text-military-taupe/80 space-y-0.5 sm:space-y-1">
        <div>MEM: 64TB</div>
        <div>CPU: 12%</div>
        <div className="hidden sm:block">NET: SECURE</div>
        <div className="hidden sm:block">ENC: AES-256</div>
      </div>

      {/* Warning indicator - bottom right */}
      <div className="absolute bottom-16 right-2 sm:bottom-20 sm:right-4 font-ibm-mono text-[6px] sm:text-[8px]">
        <div className="flex items-center gap-1 text-military-red/50">
          <span className="animate-pulse">⚠</span>
          <span className="hidden sm:inline">COMMS_ENCRYPTED</span>
        </div>
      </div>

      {/* Targeting brackets around center area */}
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-military-steel/10 rounded-sm opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-4 h-4 border-l-2 border-t-2 border-military-steel/20" />
      <div className="absolute top-1/4 right-1/4 w-4 h-4 border-r-2 border-t-2 border-military-steel/20" />
      <div className="absolute bottom-1/4 left-1/4 w-4 h-4 border-l-2 border-b-2 border-military-steel/20" />
      <div className="absolute bottom-1/4 right-1/4 w-4 h-4 border-r-2 border-b-2 border-military-steel/20" />

      {/* Animated data stream - left side */}
      <div className="absolute top-1/3 left-1 font-ibm-mono text-[5px] sm:text-[6px] text-military-rust space-y-0.5 overflow-hidden h-20 hidden sm:block">
        <div>01100110</div>
        <div>11010100</div>
        <div>00110011</div>
        <div>10101010</div>
      </div>

      {/* Animated data stream - right side */}
      <div className="absolute bottom-1/3 right-1 font-ibm-mono text-[5px] sm:text-[6px] text-military-rust space-y-0.5 overflow-hidden h-20 hidden sm:block">
        <div>10110011</div>
        <div>01010100</div>
        <div>11001101</div>
        <div>00101011</div>
      </div>

      {/* Grid overlay - always visible */}
      <div className="absolute inset-0 grid-overlay opacity-50 sm:opacity-100" />

      {/* Noise overlay - lighter on mobile */}
      <div className="absolute inset-0 noise-overlay opacity-15 sm:opacity-30" />

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.3) 100%)'
      }} />
    </div>
  );
}
