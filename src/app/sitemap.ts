import type { MetadataRoute } from 'next';
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllMissions } from '@/lib/missions-registry';
import { getAllCampaigns } from '@/lib/campaigns';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllWorldEntries } from '@/lib/world';
import { absoluteUrl } from '@/lib/seo';

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency'];

/**
 * Static sitemap. Resolved at build time and emitted as /sitemap.xml.
 * Submit it manually in Google Search Console + Yandex.Webmaster — on a
 * *.github.io/bronepehota subpath it won't be auto-discovered at the domain root.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [units, missions, campaigns] = await Promise.all([
    getAllUnits(),
    Promise.resolve(getAllMissions()),
    Promise.resolve(getAllCampaigns()),
  ]);
  // History chapters — frontmatter only (sync fs read, no markdown rendering).
  const chapters = getAllHistoryChapters();
  // World entity pages («Алфавит вселенной») — frontmatter only too.
  const worldEntries = getAllWorldEntries();

  const staticRoutes: Array<{ path: string; freq: ChangeFreq; priority: number }> = [
    { path: '/', freq: 'weekly', priority: 1.0 },
    { path: '/encyclopedia', freq: 'weekly', priority: 0.9 },
    { path: '/encyclopedia/factions', freq: 'monthly', priority: 0.8 },
    { path: '/encyclopedia/missions', freq: 'monthly', priority: 0.8 },
    { path: '/encyclopedia/history', freq: 'monthly', priority: 0.8 },
    { path: '/encyclopedia/world', freq: 'monthly', priority: 0.7 },
    { path: '/encyclopedia/sources', freq: 'yearly', priority: 0.3 },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: absoluteUrl(r.path),
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    // Every encyclopedia unit — the primary lore/keyword surface.
    ...units.map((unit) => ({
      url: absoluteUrl(`/encyclopedia/unit/${unit.id}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.7,
    })),
    // Every mission scenario.
    ...missions.map((mission) => ({
      url: absoluteUrl(`/encyclopedia/mission/${mission.id}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.6,
    })),
    // Every campaign (Хроники войн).
    ...campaigns.map((campaign) => ({
      url: absoluteUrl(`/campaigns/${campaign.slug}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.6,
    })),
    // Every history chapter — standalone search-entry pages (self-canonical,
    // Article JSON-LD; anchor links #slug in a sitemap are ignored by crawlers).
    ...chapters.map((chapter) => ({
      url: absoluteUrl(`/encyclopedia/history/${chapter.slug}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.6,
    })),
    // Every world entity page — search entries for canon nouns (Лорд Кросс,
    // Империя Полярис, Доминион…).
    ...worldEntries.map((entry) => ({
      url: absoluteUrl(`/encyclopedia/world/${entry.slug}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.6,
    })),
  ];
}
