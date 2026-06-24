import Link from 'next/link';
import { getAllCampaigns } from '@/lib/campaigns';

export default async function CampaignsPage() {
  const campaigns = getAllCampaigns();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1
          data-testid="campaigns-title"
          className="font-russo text-2xl md:text-3xl text-military-amber mb-6"
        >
          ХРОНИКИ ВОЙН
        </h1>

        {campaigns.length === 0 && (
          <p className="text-slate-400">Пока нет опубликованных историй.</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/campaigns/${c.slug}`}
                data-testid="campaign-card"
                className="block border border-slate-700/50 hover:border-military-amber/50 rounded-sm p-4 transition-colors"
              >
                {c.era && (
                  <div className="text-xs text-hud-green font-ibm-mono mb-1">
                    {c.era}
                  </div>
                )}
                <h2 className="font-russo text-lg text-slate-100">{c.title}</h2>
                {c.subtitle && (
                  <p className="text-sm text-slate-400 mt-1">{c.subtitle}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
