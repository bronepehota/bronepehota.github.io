import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import type { LorePageRef } from '@/lib/unit-search';
import EncyclopediaPageClient from '@/components/encyclopedia/EncyclopediaPage';

export default async function EncyclopediaPage() {
  // Fetch all units at build time
  const allUnits = await getAllUnits();

  // Lore page titles for search hints (chapters + campaigns); titles only —
  // body search is out of scope by design.
  const lorePages: LorePageRef[] = [
    ...getAllHistoryChapters().map((c) => ({
      title: c.title,
      href: `/encyclopedia/history#${c.slug}`,
      kind: 'chapter' as const,
    })),
    ...getAllCampaigns().map((c) => ({
      title: c.title,
      href: '/encyclopedia/history#wars',
      kind: 'campaign' as const,
    })),
  ];

  return <EncyclopediaPageClient initialUnits={allUnits} lorePages={lorePages} />;
}
