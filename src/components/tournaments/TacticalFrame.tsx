import { cn } from '@/lib/utils';

interface TacticalFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Штриховка 45° на фоне шапки (класс из globals.css). */
  stripes?: boolean;
}

/** Тактическая рамка с угловыми скобками — мотив боевого HUD приложения
 *  (как у primary-кнопки ШТАБ на лендинге). */
export default function TacticalFrame({ children, className, stripes }: TacticalFrameProps) {
  return (
    <div
      className={cn(
        'relative border border-military-steel/40',
        stripes && 'diagonal-stripes',
        className,
      )}
    >
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-military-rust" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-military-rust" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-military-rust" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-military-rust" />
      {children}
    </div>
  );
}

/** Метка тура армлиста: «ТУР N» — когда привязка листа к туру есть в данных. */
export function TourChip({ round }: { round: number | null }) {
  if (round == null) return null;
  return (
    <span className="font-ibm-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 border border-military-rust/50 text-military-rust shrink-0">
      ТУР {round}
    </span>
  );
}
