import { ReactNode } from 'react';

export const metadata = {
  title: 'Энциклопедия — Бронепехота',
  description: 'Полный справочник по отрядам и технике Бронепехоты',
};

export default function EncyclopediaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
