import { cn } from '@/lib/utils';

interface SourceOption {
  id: string;
  label: string;
}

interface SourceSwitcherProps {
  options: SourceOption[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Tactical two-way toggle for switching which army-list source's stats are shown.
 * Rendered only when a unit exists in more than one source.
 */
export function SourceSwitcher({ options, active, onChange }: SourceSwitcherProps) {
  if (options.length < 2) return null;

  return (
    <div className="folded-paper military-corners p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
          {'// ИСТОЧНИК АРМЕЙ-ЛИСТА'}
        </span>
        <span className="font-ibm-mono text-[10px] text-military-steel/60 uppercase tracking-wider">
          РЕДАКЦИЯ
        </span>
      </div>
      <div
        role="tablist"
        aria-label="Источник армей-листа"
        className="grid grid-cols-2 gap-1 p-1 bg-military-charcoal/70 border border-military-steel/30 rounded-sm"
      >
        {options.map((opt) => {
          const isActive = opt.id === active;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.id)}
              className={cn(
                'font-ibm-mono text-[11px] sm:text-xs uppercase tracking-wider py-2 px-2 rounded-sm',
                'transition-all duration-200 active:scale-[0.98] min-h-[40px]',
                isActive
                  ? 'bg-military-rust text-military-dark font-bold shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]'
                  : 'text-military-sand/60 hover:text-military-sand hover:bg-military-steel/20',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
