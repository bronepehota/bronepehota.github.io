import Link from 'next/link';
import type { UnitCampaignRef } from '@/lib/campaigns';

interface UnitCampaignsProps {
  campaigns: UnitCampaignRef[];
}

/**
 * «// УЧАСТИЕ В ВОЙНАХ» — the reverse edge of the campaign→unit link.
 *
 * The chronicle detail pages already list their participants; this block makes
 * the graph bidirectional from the unit side («этот танк воевал тут-то»).
 * Data comes from the campaign frontmatter rosters via `unitCampaigns()`
 * (computed on the server page — this component stays presentational and
 * hook-free). Renders nothing when the unit fought in no chronicle.
 */
export function UnitCampaigns({ campaigns }: UnitCampaignsProps) {
  if (campaigns.length === 0) return null;
  return (
    <section id="campaigns" className="folded-paper military-corners p-6 scroll-mt-4" data-testid="unit-campaigns">
      <h2 className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-3">
        {'// УЧАСТИЕ В ВОЙНАХ'}
      </h2>
      <ul>
        {campaigns.map((c) => (
          <li key={c.slug} className="border-b border-military-steel/15 last:border-b-0">
            <Link
              href={`/campaigns/${c.slug}`}
              data-testid="unit-campaign-link"
              className="group flex items-baseline gap-3 py-2.5"
            >
              <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                {c.title}
              </span>
              <span className="ml-auto text-right text-xs text-military-steel/70 group-hover:text-military-taupe transition-colors">
                {c.role}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
