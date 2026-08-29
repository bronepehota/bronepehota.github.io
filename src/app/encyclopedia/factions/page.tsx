import { getFactions } from '@/lib/encyclopedia-registry';
import FactionsListPage from '@/components/encyclopedia/FactionsListPage';

export const metadata = {
  title: 'Фракции — Энциклопедия Бронепехота',
  description: 'Стороны конфликта: Империя Полярис, Торговый Протекторат, Наёмники и Мародеры.',
  alternates: { canonical: '/encyclopedia/factions' },
};

export default function FactionsPage() {
  // Registry data is bundled at build time (static export) — synchronous access.
  return <FactionsListPage factions={getFactions()} />;
}
