import type { Metadata } from 'next';
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { buildLorePages } from '@/lib/lore-pages';
import EncyclopediaPageClient from '@/components/encyclopedia/EncyclopediaPage';
import { pageOpenGraph } from '@/lib/seo';

// The units catalog. Formerly THE /encyclopedia root (historical accident:
// the encyclopedia grew out of the unit list) — moved here when the root
// became the «Архив вселенной» hub. Behaviour (console + filters + grid +
// lore hints) is unchanged; deep-links /encyclopedia?faction=… forward here.
const TITLE = 'Юниты — Энциклопедия Бронепехоты';
const DESCRIPTION =
  'Каталог боевых единиц Бронепехоты: отряды, герои, техника и орудия всех фракций — с досье, происхождением и покрасами.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/encyclopedia/units' },
  // A page-level openGraph object REPLACES the root-layout one — pageOpenGraph
  // reassembles the full set (site og:image card included) with og:url.
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia/units',
  }),
};

export default async function UnitsPage() {
  // Fetch all units at build time
  const allUnits = await getAllUnits();

  // Lore pages for search hints (shared builder with the hub — see
  // src/lib/lore-pages.ts for what each entry carries and why).
  const lorePages = buildLorePages(allUnits);

  return <EncyclopediaPageClient initialUnits={allUnits} lorePages={lorePages} />;
}
