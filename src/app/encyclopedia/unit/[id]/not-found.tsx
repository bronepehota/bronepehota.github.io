import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-military-dark flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-russo text-3xl md:text-4xl font-black military-text-gradient uppercase tracking-wide mb-4">
          Отряд не найден
        </h1>
        <p className="font-ibm-mono text-xs text-military-taupe mb-8 uppercase tracking-wider">
          Такого отряда не существует в энциклопедии
        </p>
        <Link
          href="/encyclopedia/units"
          className="inline-flex min-h-[44px] items-center gap-2 border border-military-amber/50 bg-military-charcoal/60 px-6 font-ibm-mono text-[11px] uppercase tracking-wider text-military-amber hover:border-military-amber transition-colors touch-manipulation"
        >
          <span>Вернуться к каталогу</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
