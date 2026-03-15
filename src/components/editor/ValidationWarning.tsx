/**
 * Validation warning component - displays validation warnings for units
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { ValidationWarning as ValidationWarningType } from '@/lib/editor/types';
import { cn } from '@/lib/utils';

interface ValidationWarningProps {
  warnings: ValidationWarningType[];
  className?: string;
}

export function ValidationWarning({ warnings, className }: ValidationWarningProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-lg border p-3 bg-amber-900/10 border-amber-600/30",
      className
    )}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-amber-300 mb-1">
            Предупреждения валидации
          </div>
          <ul className="text-xs text-amber-200/80 space-y-0.5">
            {warnings.map((warning, index) => (
              <li key={index}>
                <span className="text-amber-400">{warning.field}:</span> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version - single line with count
 */
interface ValidationWarningCompactProps {
  warnings: ValidationWarningType[];
  onClick?: () => void;
}

export function ValidationWarningCompact({ warnings, onClick }: ValidationWarningCompactProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-900/30 border border-amber-600/30 hover:bg-amber-900/50 transition-all"
      title={`${warnings.length} предупреждений`}
    >
      <AlertTriangle className="w-3 h-3 text-amber-400" />
      <span className="text-xs text-amber-300">{warnings.length}</span>
    </button>
  );
}
