import { getAllMissions, getAllCampaigns } from '@/lib/missions-registry';
import MissionListPage from '@/components/missions/MissionListPage';
import { pageOpenGraph } from '@/lib/seo';

const TITLE = 'Миссии — Энциклопедия Бронепехоты';
const DESCRIPTION = 'Боевые сценарии (миссии) с предысториями, схемами расстановки и условиями победы.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/encyclopedia/missions' },
  // A page-level openGraph object REPLACES the root-layout one (Next merges
  // top-level fields only) — pageOpenGraph reassembles the full set, including
  // the site og:image card, and adds this page's own og:url.
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia/missions',
  }),
};

export default function MissionsPage() {
  // Registry data is bundled at build time (static export) — synchronous access.
  return <MissionListPage missions={getAllMissions()} campaigns={getAllCampaigns()} />;
}
