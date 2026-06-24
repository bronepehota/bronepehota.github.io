import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCampaigns, getCampaign } from '@/lib/campaigns';

export function generateStaticParams() {
  return getAllCampaigns().map((c) => ({ slug: c.slug }));
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const campaign = await getCampaign(params.slug);
  if (!campaign) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <Link
          href="/campaigns"
          className="text-sm text-hud-green mb-4 inline-block"
        >
          ← Хроники войн
        </Link>

        <h1 className="font-russo text-2xl md:text-3xl text-military-amber">
          {campaign.title}
        </h1>
        {campaign.subtitle && (
          <p className="text-slate-400 mt-1">{campaign.subtitle}</p>
        )}
        {campaign.era && (
          <p className="text-xs text-hud-green font-ibm-mono mt-2">
            Эпоха: {campaign.era}
          </p>
        )}

        {/* Rendered Markdown body. Content is first-party/trusted (authored .md). */}
        <div
          className="prose prose-invert prose-headings:text-military-amber prose-a:text-hud-green max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
        />

        {campaign.units && campaign.units.length > 0 && (
          <section className="mt-10">
            <h2 className="font-russo text-lg text-slate-200 mb-3">Участники</h2>
            <ul className="flex flex-wrap gap-2">
              {campaign.units.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/encyclopedia/unit/${u.id}`}
                    className="inline-block text-sm px-3 py-1.5 rounded-sm border border-slate-700/50 hover:border-military-amber/50 transition-colors"
                  >
                    {u.role}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {campaign.missions && campaign.missions.length > 0 && (
          <section className="mt-8">
            <h2 className="font-russo text-lg text-slate-200 mb-3">Миссии</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {campaign.missions.map((m, i) => (
                <li
                  key={i}
                  className="border border-slate-800 rounded-sm p-3"
                >
                  <div className="font-russo text-military-amber">{m.name}</div>
                  <div className="text-xs text-slate-400">Коробка: {m.box}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
