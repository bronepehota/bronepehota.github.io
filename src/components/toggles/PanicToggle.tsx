'use client';

import { useState, useEffect } from 'react';
import { Footprints, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanicToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  rulesVersion: string;
}

const PANIC_STORAGE_KEY = 'bronepehota_panic_enabled';

export function PanicToggle({ enabled, onEnabledChange, rulesVersion }: PanicToggleProps) {
  const [showModal, setShowModal] = useState(false);

  // Load saved preference on mount (only once, intentionally)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = localStorage.getItem(PANIC_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleToggle = () => {
    const newValue = !enabled;
    onEnabledChange(newValue);
    localStorage.setItem(PANIC_STORAGE_KEY, String(newValue));
  };

  // Rule description based on version
  const ruleText = rulesVersion === 'community_star_system'
    ? 'D6 > ранг при 50% потерь'
    : 'D6 = броня при уроне';

  return (
    <>
      <div
        className={cn(
          'relative w-full rounded-lg border-2 transition-all duration-200',
          'p-3 min-h-[56px]',
          enabled
            ? 'bg-orange-950/30 border-orange-600/60'
            : 'bg-slate-800/40 border-slate-700/50'
        )}
        data-testid="panic-toggle"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
            enabled ? 'bg-orange-600/30' : 'bg-slate-700/50'
          )}>
            <Footprints className={cn(
              'w-4 h-4 transition-colors',
              enabled ? 'text-orange-400' : 'text-slate-500'
            )} />
          </div>

          {/* Content */}
          <button
            onClick={handleToggle}
            className="flex-1 min-w-0 text-left touch-manipulation"
            aria-pressed={enabled}
            aria-label={`Паника: ${enabled ? 'включена' : 'выключена'}`}
          >
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-orange-300' : 'text-slate-400'
            )}>
              ПАНИКА
            </span>
            <p className={cn(
              'text-[10px] font-mono truncate mt-0.5',
              enabled ? 'text-orange-400/70' : 'text-slate-500'
            )}>
              {ruleText}
            </p>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о панике"
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>

          {/* Toggle indicator */}
          <button
            onClick={handleToggle}
            className={cn(
              'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative touch-manipulation',
              enabled ? 'bg-orange-600/40' : 'bg-slate-700'
            )}
            aria-label={enabled ? 'Отключить панику' : 'Включить панику'}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
              enabled
                ? 'left-[22px] bg-orange-400'
                : 'left-0.5 bg-slate-500'
            )} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-mono font-bold text-orange-300">ПАНИКА</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/30">
                <h4 className="text-xs font-mono font-bold text-blue-400 mb-2">Официальные правила</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Каждый солдат проходит <strong>Тест выживания</strong> при получении урона.
                  Бросок D6 равный броне (Бр) = паника. Паникующий солдат бежит к границе поля.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/30">
                <h4 className="text-xs font-mono font-bold text-purple-400 mb-2">Правила сообщества</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Отряд проходит тест автоматически при потере <strong>50% солдат</strong>.
                  Бросок D6, результат превышающий армейский ранг = паника.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
