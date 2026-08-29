import { getAllMissions, getAllCampaigns } from '@/lib/missions-registry';
import MissionListPage from '@/components/missions/MissionListPage';

export const metadata = {
  title: 'Миссии — Энциклопедия Бронепехота',
  description: 'Боевые сценарии (миссии) с предысториями, схемами расстановки и условиями победы.',
  alternates: { canonical: '/encyclopedia/missions' },
};

export default function MissionsPage() {
  // Registry data is bundled at build time (static export) — synchronous access.
  return <MissionListPage missions={getAllMissions()} campaigns={getAllCampaigns()} />;
}
