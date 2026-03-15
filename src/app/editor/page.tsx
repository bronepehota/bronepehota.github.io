/**
 * Editor main page
 */

'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import to avoid SSR issues with localStorage
const EditorLayout = dynamic(
  () => import('@/components/editor/EditorLayout').then(mod => mod.EditorLayout),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Загрузка редактора...</div>
      </div>
    ),
  }
);

export default function EditorPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← На главную
            </Link>
            <h1 className="text-lg font-semibold">Редактор армлистов</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <EditorLayout />
      </main>

      {/* Footer warning */}
      <footer className="bg-amber-900/30 border-t border-amber-700/50 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-200 text-sm">
          <span>⚠️</span>
          <span>
            Данные хранятся локально в браузере. Для публикации экспортируйте JSON и создайте issue в проекте.
          </span>
        </div>
      </footer>
    </div>
  );
}
