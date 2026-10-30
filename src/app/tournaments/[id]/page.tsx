import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTournaments, getTournament } from '@/lib/tournaments-registry';
import TournamentDetailPage from '@/components/tournaments/TournamentDetailPage';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, pageOpenGraph } from '@/lib/seo';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  // Реестр бандлится на билде (static export) — синхронный доступ.
  return getAllTournaments().map((t) => ({ id: t.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const tournament = getTournament(params.id);
  if (!tournament) {
    return { title: 'Турнир не найден — Бронепехота' };
  }
  const title = `«${tournament.name}» — Турниры — Бронепехота`;
  const description = `Итоги турнира «${tournament.name}» (${tournament.date}): места, матчи по турам и ростеры участников.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/tournaments/${tournament.id}`) },
    openGraph: pageOpenGraph({ title, description, path: `/tournaments/${tournament.id}` }),
  };
}

export default function Page({ params }: PageProps) {
  const tournament = getTournament(params.id);
  if (!tournament) {
    notFound();
  }
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Турниры', path: '/tournaments' },
          { name: tournament.name, path: `/tournaments/${tournament.id}` },
        ])}
      />
      <TournamentDetailPage tournament={tournament} />
    </>
  );
}
