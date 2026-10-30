import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllPlayers,
  getPlayer,
  getPlayerTournaments,
  getRating,
} from '@/lib/tournaments-registry';
import PlayerProfilePage from '@/components/tournaments/PlayerProfilePage';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, pageOpenGraph } from '@/lib/seo';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return getAllPlayers().map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const player = getPlayer(params.id);
  if (!player) {
    return { title: 'Игрок не найден — Бронепехота' };
  }
  const title = `${player.nick} — профиль игрока — Бронепехота`;
  const description = `${player.name ?? player.nick}: статистика турниров «Бронепехоты» — партии, победы, процент, кубки и история матчей.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/players/${player.id}`) },
    openGraph: pageOpenGraph({ title, description, path: `/players/${player.id}` }),
  };
}

export default function Page({ params }: PageProps) {
  const player = getPlayer(params.id);
  if (!player) {
    notFound();
  }
  const rating = getRating().find((r) => r.player.id === player.id);
  const tournaments = getPlayerTournaments(player.id);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Турниры', path: '/tournaments' },
          { name: player.nick, path: `/players/${player.id}` },
        ])}
      />
      <PlayerProfilePage player={player} rating={rating} tournaments={tournaments} />
    </>
  );
}
