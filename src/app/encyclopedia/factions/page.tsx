import { getFactions } from '@/lib/encyclopedia-registry';
import FactionsListPage from '@/components/encyclopedia/FactionsListPage';
import { pageOpenGraph } from '@/lib/seo';

// The roster mirrors factions.json (review SEO): the old description named
// three sides while the encyclopedia carries six.
const TITLE = 'Фракции — Энциклопедия Бронепехоты';
const DESCRIPTION =
  'Стороны конфликта вселенной Бронепехоты: Империя Полярис, Торговый Протекторат, Косари-наёмники, Снежные Волки, Мёртвый Флот и Рутения — девизы, миры-колыбели и досье фракций.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/encyclopedia/factions' },
  // A page-level openGraph object REPLACES the root-layout one (Next merges
  // top-level fields only) — pageOpenGraph reassembles the full set, including
  // the site og:image card, and adds this page's own og:url.
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia/factions',
  }),
};

export default function FactionsPage() {
  // Registry data is bundled at build time (static export) — synchronous access.
  return <FactionsListPage factions={getFactions()} />;
}
