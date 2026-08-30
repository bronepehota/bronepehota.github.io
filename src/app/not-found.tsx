import type { Metadata } from 'next';
import Link from 'next/link';

// noindex: 404 не должен попадать в индекс (раньше наследовал canonical главной).
export const metadata: Metadata = {
  title: 'Страница не найдена — Бронепехота',
  robots: { index: false, follow: false },
};

/** Root 404 — served by GitHub Pages as 404.html for any unknown path.
 *  Styled like the rest of the app (military dossier idiom). */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-military-dark flex items-center justify-center px-4">
      <div className="folded-paper military-corners p-8 max-w-md w-full text-center">
        <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-rust/70 mb-3">
          {'// ОШИБКА 404'}
        </p>
        <h1 className="font-russo font-black text-2xl md:text-3xl text-white military-text-gradient uppercase mb-3">
          Страница не найдена
        </h1>
        <p className="text-military-taupe text-sm mb-8">
          Такого досье в архиве нет. Возможно, ссылка устарела или юнит переведён в
          другой сектор.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/encyclopedia"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded font-russo uppercase tracking-wider text-sm text-military-dark bg-military-amber hover:bg-amber-400 transition-colors"
          >
            К энциклопедии
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded font-russo uppercase tracking-wider text-sm text-military-sand border border-military-steel/40 hover:border-military-amber/60 hover:text-military-amber transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
