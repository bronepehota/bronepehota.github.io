'use client';
import type { ReactNode } from 'react';

/** Hazard topbar with brand + nav. */
export function HazardTopbar({ brand, children }: { brand: ReactNode; children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 bg-[var(--panel)]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="editor-hazard" />
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="font-display text-lg tracking-wider text-[var(--bone)]">{brand}</span>
        <span className="flex-1" />
        {children}
      </div>
    </div>
  );
}

export function EdPanel({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="ed-panel p-3">
      {title && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--border)]">
          <span className="font-ui text-xs uppercase tracking-widest text-[var(--muted)]">{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** Monospace stat cell; `empty` pulses red (unfilled). */
export function StatCell({ value, empty }: { value: ReactNode; empty?: boolean }) {
  return (
    <span className={`font-stat text-center px-2 py-1 rounded border ${empty ? 'border-[var(--red)] bg-[rgba(244,63,94,.14)] animate-pulse' : 'border-[var(--border2)] bg-[var(--bg)]'}`}>
      {value}
    </span>
  );
}

export function StatusPill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <span className={`font-stat text-[11px] px-2 py-0.5 rounded ${ok ? 'ed-ok' : 'ed-bad'}`}>{children}</span>;
}
