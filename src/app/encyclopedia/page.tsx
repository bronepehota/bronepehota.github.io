import { getAllUnits } from '@/lib/encyclopedia-utils';
import EncyclopediaPageClient from '@/components/encyclopedia/EncyclopediaPage';

export default async function EncyclopediaPage() {
  // Fetch all units at build time
  const allUnits = await getAllUnits();

  return <EncyclopediaPageClient initialUnits={allUnits} />;
}
