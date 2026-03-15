/**
 * Editor layout - provides consistent structure for editor pages
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Редактор армлистов | Бронепехота',
  description: 'Создание и редактирование пользовательских армейских листов',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {children}
    </div>
  );
}
