import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Тайтл вкладки для штаба — короткий, не SEO-строка лендинга.
// Остальные метаданные наследуются от root layout.
export const metadata: Metadata = {
  title: 'Штаб — Бронепехота',
};

// Pass-through layout: только метаданные,(children) рендерятся как есть.
// Default export обязателен — dev-рантайм Next 14 валидирует его даже у
// metadata-only layout (без него 500 «default export is not a React Component»).
export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
