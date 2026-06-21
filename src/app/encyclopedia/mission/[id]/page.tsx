import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllMissions, getMission, getCampaign } from '@/lib/missions-registry';
import MissionDetailPage from '@/components/missions/MissionDetailPage';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  // Registry data is bundled at build time (static export) — synchronous access.
  return getAllMissions().map((m) => ({ id: m.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const mission = getMission(params.id);
  if (!mission) {
    return { title: 'Не найдено — Энциклопедия Бронепехота' };
  }
  const firstObjective = Object.values(mission.objectives)[0];
  return {
    title: `Миссия «${mission.name}» — Энциклопедия Бронепехота`,
    description: firstObjective?.text ?? `Боевой сценарий «${mission.name}»`,
  };
}

export default function Page({ params }: PageProps) {
  const mission = getMission(params.id);
  if (!mission) {
    notFound();
  }
  const campaign = getCampaign(mission.campaign);
  return <MissionDetailPage mission={mission} campaign={campaign} />;
}
