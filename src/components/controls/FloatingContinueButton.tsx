import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface FloatingContinueButtonProps {
  /** Text to display on the button */
  text: string;
  /** Tooltip text shown on hover */
  tooltip: string;
  /** Accent color for borders and effects (e.g., "#ef4444", "#3b82f6") */
  accentColor: string;
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** testid for E2E testing */
  dataTestid: string;
  /** Optional icon to display before text */
  icon?: ReactNode;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * FloatingContinueButton - A reusable floating continue button for setup screens
 *
 * Features:
 * - Fixed positioning at bottom of screen
 * - Semi-transparent background with backdrop blur
 * - Scroll indicator (gradient lines above button)
 * - Tech corner accents
 * - Hover glow effect
 * - Mobile-friendly sizing
 */
export function FloatingContinueButton({
  text,
  tooltip,
  accentColor,
  onClick,
  disabled = false,
  dataTestid,
  icon,
  className,
}: FloatingContinueButtonProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4">
      <div
        className={clsx('relative group', disabled && 'opacity-50')}
        style={{ maxWidth: '400px', width: '100%' }}
      >
        {/* Scroll indicator at top - gradient fade showing content continues */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full" />
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent rounded-full" />
          <div className="w-4 h-0.5 bg-slate-700 rounded-full animate-pulse" />
        </div>

        {/* Outer glow */}
        <div
          className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
          style={{
            backgroundColor: disabled ? undefined : accentColor,
            opacity: disabled ? 0 : 0.3,
          }}
        />

        {/* Main button - smaller size as requested */}
        <button
          onClick={onClick}
          disabled={disabled}
          data-testid={dataTestid}
          className={clsx(
            'relative w-full pointer-events-auto',
            // Smaller size: py-2.5 px-5 (between original py-4 px-6 and minimal)
            'py-2.5 px-5 rounded-lg',
            'flex items-center justify-center gap-3',
            'font-mono text-sm md:text-base font-bold uppercase tracking-wider',
            'transition-all duration-200',
            'border-2',
            // Semi-transparent background
            'bg-slate-900/80 backdrop-blur-md text-white',
            'hover:scale-[1.02] hover:bg-slate-900/90',
            'active:scale-95',
            'shadow-lg hover:shadow-xl',
            disabled && 'cursor-not-allowed hover:scale-100 active:scale-100',
            className
          )}
          style={{ borderColor: accentColor }}
          aria-disabled={disabled}
        >
          {/* Top fade indicator - subtle gradient showing content behind */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none rounded-t-lg" />

          {/* Animated background effect */}
          {!disabled && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
              style={{ backgroundColor: accentColor }}
            />
          )}

          {/* Scanline effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-full w-full animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          </div>

          {/* Icon */}
          {icon && <span className="relative z-10">{icon}</span>}

          {/* Text */}
          <span className="relative z-10">{text}</span>

          {/* Tech corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 opacity-50" style={{ borderColor: accentColor }} />
          <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 opacity-50" style={{ borderColor: accentColor }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 opacity-50" style={{ borderColor: accentColor }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 opacity-50" style={{ borderColor: accentColor }} />
        </button>

        {/* Tooltip on hover */}
        {!disabled && (
          <div
            className={clsx(
              'absolute -top-12 left-1/2 -translate-x-1/2',
              'whitespace-nowrap px-3 py-1.5 rounded',
              'bg-slate-900/95 text-slate-300 text-xs font-mono font-medium',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'border border-slate-700/50 shadow-lg',
              'pointer-events-none'
            )}
          >
            {tooltip}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-slate-700/50" />
          </div>
        )}
      </div>
    </div>
  );
}
