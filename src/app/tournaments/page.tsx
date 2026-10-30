import type { Metadata } from 'next';
import TournamentsHub from '@/components/tournaments/TournamentsHub';
import { getAllTournaments, getRating } from '@/lib/tournaments-registry';
import { pageOpenGraph } from '@/lib/seo';

const TITLE = 'Турниры — Бронепехота';
const DESCRIPTION = 'Рейтинг игроков и итоги турниров «Бронепехоты»: победы, партии, кубки и протоколы.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/tournaments' },
  openGraph: pageOpenGraph({ title: TITLE, description: DESCRIPTION, path: '/tournaments' }),
};

export default function TournamentsPage() {
  // Данные бандлятся на билде (static export) — синхронный доступ.
  return <TournamentsHub rating={getRating()} tournaments={getAllTournaments()} />;
}
