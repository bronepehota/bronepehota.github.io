/**
 * Validation warning component - shows warnings without blocking saves
 */

'use client';

import { AlertTriangle } from 'lucide-react';

interface ValidationWarningProps {
  warnings: string[];
}

export function ValidationWarning({ warnings }: ValidationWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-900/30 border border-amber-700/50 rounded-md p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-amber-200 mb-1">
            Предупреждения
          </div>
          <ul className="text-xs text-amber-300 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
