import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllMissions, getMission, getCampaign } from '@/lib/missions-registry';
import MissionDetailPage from '@/components/missions/MissionDetailPage';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, pageOpenGraph } from '@/lib/seo';

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
    return { title: 'Миссия не найдена — Энциклопедия Бронепехоты' };
  }
  const firstObjective = Object.values(mission.objectives)[0];
  const description = firstObjective?.text ?? `Боевой сценарий «${mission.name}»`;
  return {
    title: `Миссия «${mission.name}» — Энциклопедия Бронепехоты`,
    description,
    alternates: {
      canonical: absoluteUrl(`/encyclopedia/mission/${mission.id}`),
    },
    // Full OG set via pageOpenGraph — a bare {title, description} object would
    // REPLACE the layout's og:image card (Next merges only top-level fields).
    openGraph: pageOpenGraph({
      title: `Миссия «${mission.name}»`,
      description,
      path: `/encyclopedia/mission/${mission.id}`,
    }),
  };
}

export default function Page({ params }: PageProps) {
  const mission = getMission(params.id);
  if (!mission) {
    notFound();
  }
  const campaign = getCampaign(mission.campaign);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Энциклопедия', path: '/encyclopedia' },
          { name: 'Миссии', path: '/encyclopedia/missions' },
          { name: `Миссия «${mission.name}»`, path: `/encyclopedia/mission/${mission.id}` },
        ])}
      />
      <MissionDetailPage mission={mission} campaign={campaign} />
    </>
  );
}
