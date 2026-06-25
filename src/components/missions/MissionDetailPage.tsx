'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { FactionLogo } from '@/components/FactionLogo';
import { factionDisplayNames, getFactionColors } from '@/lib/faction-colors';
import type { Mission, Campaign } from '@/lib/mission-types';
import type { FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Target,
  Clock,
  Flag,
  Crosshair,
  AlertTriangle,
  Ruler,
  Users,
  Truck,
  Bomb,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface MissionDetailPageProps {
  mission: Mission;
  campaign?: Campaign;
}

export default function MissionDetailPage({ mission, campaign }: MissionDetailPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => setIsLoaded(true), []);

  const factionEntries = Object.entries(mission.objectives) as [FactionID, Mission['objectives'][string]][];

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
      }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="relative py-8 md:py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back link */}
            <Link
              href="/encyclopedia/missions"
              className={cn(
                'inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm',
                'text-military-rust/60 hover:text-military-amber transition-colors',
                'tracking-widest uppercase mb-8',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100',
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>К миссиям</span>
            </Link>

            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
            >
              {/* Classification stamp */}
              <div className="mb-4 inline-block">
                <div className="border-2 border-military-rust/60 px-3 py-1 rotate-[-2deg]">
                  <span className="font-ibm-mono text-xs text-military-rust tracking-wider">
                    СОВЕРШЕННО СЕКРЕТНО
                  </span>
                </div>
              </div>

              {/* Mission name */}
              <h1 className="font-russo font-black text-3xl md:text-4xl lg:text-5xl text-white mb-3 military-text-gradient">
                Миссия «{mission.name}»
              </h1>

              {/* Faction row */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {mission.factions.map((f) => {
                  const color = getFactionColors(f);
                  return (
                    <div key={f} className="flex items-center gap-2">
                      <div
                        className="relative w-7 h-7 flex items-center justify-center rounded"
                        style={{ backgroundColor: `${color.primary}20`, border: `1px solid ${color.primary}` }}
                      >
                        <div className="absolute inset-0.5">
                          <FactionLogo faction={f} className="w-full h-full" />
                        </div>
                      </div>
                      <span className="font-oswald text-base md:text-lg" style={{ color: color.primary }}>
                        {factionDisplayNames[f] ?? f}
                      </span>
                    </div>
                  );
                })}
                {campaign && (
                  <span className="font-ibm-mono text-xs text-military-rust/60 uppercase tracking-wider">
                    Кампания «{campaign.name}»
                  </span>
                )}
              </div>

              {/* Parameter chips */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <ParamChip icon={Clock} label={mission.parameters.turnCount ? `${mission.parameters.turnCount} ходов` : 'без лимита ходов'} />
                {mission.parameters.firstMove && (
                  <ParamChip
                    icon={Flag}
                    label={`Первый ход: ${factionDisplayNames[mission.parameters.firstMove] ?? mission.parameters.firstMove}`}
                  />
                )}
                {mission.parameters.rulesVariant && (
                  <ParamChip icon={Crosshair} label={mission.parameters.rulesVariant} />
                )}
              </div>

              <div className="military-divider max-w-xs mt-4" />
            </div>
          </div>
        </header>

        {/* Content sections */}
        <main className="px-4 pb-20">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Campaign intro */}
            {campaign?.intro && (
              <Section delay="0.3s" isLoaded={isLoaded}>
                <p className="font-oswald text-sm md:text-base text-military-taupe/80 leading-relaxed italic">
                  {campaign.intro} {mission.tagline}
                </p>
              </Section>
            )}

            {/* Briefing dossier */}
            <Section title="Предыстория" icon={FileText} delay="0.35s" isLoaded={isLoaded}>
              <div className="space-y-4">
                <BriefingBlock label="Обстановка" text={mission.briefing.setting} />
                <BriefingBlock label="Приказ" text={mission.briefing.order} />
                <BriefingBlock label="Донесение" text={mission.briefing.report} />
              </div>
            </Section>

            {/* Setup */}
            {mission.setup && (
              <Section title="Подготовка поля боя" icon={Ruler} delay="0.4s" isLoaded={isLoaded}>
                <p className="text-military-sand/80 leading-relaxed text-sm whitespace-pre-line">
                  {mission.setup}
                </p>
              </Section>
            )}

            {/* Deployment diagram */}
            <Section title="Схема расстановки" icon={Crosshair} delay="0.45s" isLoaded={isLoaded}>
              {mission.diagramImage ? (
                <div className="relative folded-paper military-corners overflow-hidden">
                  <div className="relative w-full">
                    <GitHubPagesImage
                      src={mission.diagramImage}
                      alt={`Схема расстановки — миссия «${mission.name}»`}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              ) : (
                <div className="folded-paper military-corners p-10 text-center">
                  <Crosshair className="w-10 h-10 text-military-steel/40 mx-auto mb-3" />
                  <p className="font-oswald text-military-taupe">Схема будет добавлена</p>
                  <p className="font-ibm-mono text-xs text-military-steel/60 mt-1">
                    См. схему в оригинальном листе миссии
                  </p>
                </div>
              )}
            </Section>

            {/* Objectives — asymmetric, per faction */}
            <Section title="Условия победы" icon={Target} delay="0.5s" isLoaded={isLoaded}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factionEntries.map(([faction, obj]) => {
                  const color = getFactionColors(faction);
                  return (
                    <div
                      key={faction}
                      className="rounded-lg p-4 border"
                      style={{ borderColor: `${color.primary}50`, backgroundColor: `${color.primary}0d` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-6 h-6 flex items-center justify-center rounded" style={{ border: `1px solid ${color.primary}` }}>
                          <div className="absolute inset-0.5">
                            <FactionLogo faction={faction} className="w-full h-full" />
                          </div>
                        </div>
                        <h3 className="font-oswald text-base uppercase tracking-wide" style={{ color: color.primary }}>
                          Задача: {factionDisplayNames[faction] ?? faction}
                        </h3>
                      </div>
                      <p className="text-military-sand/90 text-sm leading-relaxed mb-2">{obj.text}</p>
                      {obj.victoryConditions && obj.victoryConditions.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {obj.victoryConditions.map((vc, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-military-taupe/80">
                              <span className="text-military-rust mt-0.5">▸</span>
                              <span>{vc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Special rules */}
            {mission.specialRules && mission.specialRules.length > 0 && (
              <Section delay="0.55s" isLoaded={isLoaded}>
                <div className="rounded-lg p-4 border border-military-amber/40 bg-military-amber/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-military-amber" />
                    <h3 className="font-oswald text-base text-military-amber uppercase tracking-wide">
                      Особые правила
                    </h3>
                  </div>
                  <ul className="space-y-1.5">
                    {mission.specialRules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-military-sand/90">
                        <span className="text-military-amber mt-0.5">!</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            )}

            {/* Composition per side */}
            {mission.participants && Object.keys(mission.participants).length > 0 && (
              <Section title="Состав сторон" icon={Users} delay="0.6s" isLoaded={isLoaded}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.keys(mission.participants) as FactionID[])
                    .filter((f) => (mission.participants?.[f]?.length ?? 0) > 0)
                    .map((faction) => {
                      const color = getFactionColors(faction);
                      const units = mission.participants![faction];
                      return (
                        <div
                          key={faction}
                          className="rounded-lg p-4 border"
                          style={{ borderColor: `${color.primary}50`, backgroundColor: `${color.primary}0d` }}
                        >
                          <div className="flex items-center gap-2 mb-2.5">
                            <div
                              className="relative w-6 h-6 flex items-center justify-center rounded"
                              style={{ border: `1px solid ${color.primary}` }}
                            >
                              <div className="absolute inset-0.5">
                                <FactionLogo faction={faction} className="w-full h-full" />
                              </div>
                            </div>
                            <h3 className="font-oswald text-base uppercase tracking-wide" style={{ color: color.primary }}>
                              {factionDisplayNames[faction] ?? faction}
                            </h3>
                          </div>
                          <ul className="space-y-1.5">
                            {units.map((u, i) => {
                              const Icon = u.type === 'squad' ? Users : u.type === 'machine' ? Truck : Bomb;
                              return (
                                <li key={i} className="flex items-center gap-2 text-sm text-military-sand/90">
                                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: color.primary }} />
                                  {u.unitId ? (
                                    <Link
                                      href={`/encyclopedia/unit/${u.unitId}`}
                                      className="hover:text-military-amber underline-offset-2 hover:underline transition-colors"
                                    >
                                      {u.name}
                                    </Link>
                                  ) : (
                                    <span>{u.name}</span>
                                  )}
                                  {u.count && u.count > 1 && (
                                    <span className="font-ibm-mono text-xs text-military-taupe/70">×{u.count}</span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                </div>
              </Section>
            )}

            {/* Source link */}
            {mission.sourceUrl && (
              <Section delay="0.65s" isLoaded={isLoaded}>
                <a
                  href={mission.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-ibm-mono text-xs text-military-rust/70 hover:text-military-amber transition-colors uppercase tracking-wider"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Источник: tehnolog.ru
                </a>
              </Section>
            )}
          </div>
        </main>

        <div className="max-w-6xl mx-auto">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({
  title,
  icon: Icon,
  children,
  delay,
  isLoaded,
}: {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  delay: string;
  isLoaded: boolean;
}) {
  return (
    <section
      className={cn('folded-paper military-corners p-6', 'fade-in-up opacity-0', isLoaded && 'opacity-100')}
      style={{ animationFillMode: 'forwards', animationDelay: delay }}
    >
      {title && (
        <h2 className="font-oswald text-lg text-military-sand mb-3 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-military-rust" />}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function BriefingBlock({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div className="border-l-2 border-military-rust/40 pl-4">
      <div className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-1">
        {label}
      </div>
      <p className="text-military-sand/85 leading-relaxed text-sm whitespace-pre-line">{text}</p>
    </div>
  );
}

function ParamChip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-ibm-mono text-xs px-2.5 py-1 rounded bg-military-steel/20 border border-military-steel/30 text-military-sand/90 uppercase tracking-wider">
      <Icon className="w-3.5 h-3.5 text-military-rust" />
      {label}
    </span>
  );
}
