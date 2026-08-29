/**
 * Editor layout — desktop only. Loads the verifier fonts and scopes the editor theme.
 */
import type { Metadata } from 'next';
import { Black_Ops_One, JetBrains_Mono } from 'next/font/google';
import './editor-theme.css';

export const metadata: Metadata = {
  title: 'Редактор армлистов | Бронепехота',
  description: 'Создание и редактирование пользовательских армейских листов',
  // noindex: десктопный инструмент, не публичный контент (в sitemap его нет).
  robots: { index: false, follow: false },
};

const blackOps = Black_Ops_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-blackops',
  display: 'swap',
});

const jbMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jbmono',
  display: 'swap',
});

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`editor-scope ${blackOps.variable} ${jbMono.variable}`}>
      {children}
    </div>
  );
}
