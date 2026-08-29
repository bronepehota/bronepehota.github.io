import type { Metadata } from 'next';
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import type { LorePageRef } from '@/lib/unit-search';
import EncyclopediaPageClient from '@/components/encyclopedia/EncyclopediaPage';
import { pageOpenGraph } from '@/lib/seo';
import { ENCYCLOPEDIA_DESCRIPTION, ENCYCLOPEDIA_TITLE } from './meta';

// Own canonical — the root layout no longer provides one (it used to make every
// alternates-less page a "duplicate" of the homepage). Title/desc live in the
// encyclopedia layout; the page-level openGraph adds og:url (a page-level OG
// object replaces the root one — pageOpenGraph keeps the site og:image card).
export const metadata: Metadata = {
  alternates: { canonical: '/encyclopedia' },
  openGraph: pageOpenGraph({
    title: ENCYCLOPEDIA_TITLE,
    description: ENCYCLOPEDIA_DESCRIPTION,
    path: '/encyclopedia',
  }),
};

export default async function EncyclopediaPage() {
  // Fetch all units at build time
  const allUnits = await getAllUnits();

  // Lore page titles for search hints (chapters + campaigns); titles only —
  // body search is out of scope by design. Campaign hints deep-link to their
  // detail pages (/campaigns/[slug]) — not the shared #wars anchor.
  const lorePages: LorePageRef[] = [
    ...getAllHistoryChapters().map((c) => ({
      title: c.title,
      href: `/encyclopedia/history#${c.slug}`,
      kind: 'chapter' as const,
    })),
    ...getAllCampaigns().map((c) => ({
      title: c.title,
      href: `/campaigns/${c.slug}`,
      kind: 'campaign' as const,
    })),
  ];

  return <EncyclopediaPageClient initialUnits={allUnits} lorePages={lorePages} />;
}
