import type { Metadata } from 'next';
import OrganizersGuide from '@/components/tournaments/OrganizersGuide';
import { pageOpenGraph } from '@/lib/seo';

const TITLE = 'Организаторам турниров — Бронепехота';
const DESCRIPTION =
  'Критерии попадания турнира в общий рейтинг «Бронепехоты»: система подсчёта, открытость, регламент, судья. Как прислать протокол.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/tournaments/organizers' },
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/tournaments/organizers',
  }),
};

export default function OrganizersPage() {
  return <OrganizersGuide />;
}
