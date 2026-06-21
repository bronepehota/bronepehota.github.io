import Link from 'next/link';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { factionDisplayNames, getFactionColors } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';
import type { Mission } from '@/lib/mission-types';
import { getCampaign } from '@/lib/missions-registry';
import { Clock, Flag } from 'lucide-react';

interface MissionCardProps {
  mission: Mission;
}

export function MissionCard({ mission }: MissionCardProps) {
  const campaign = getCampaign(mission.campaign);
  const [sideA, sideB] = mission.factions;
  const colorA = getFactionColors(sideA);
  const colorB = getFactionColors(sideB);
  const firstMoveName = mission.parameters.firstMove
    ? factionDisplayNames[mission.parameters.firstMove]
    : undefined;

  return (
    <Link
      href={`/encyclopedia/mission/${mission.id}`}
      className="block group"
      data-testid={`mission-card-${mission.id}`}
    >
      <div className="relative folded-paper military-corners overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        {/* Visual — each mission's unique deployment diagram (fallback: faction VS) */}
        <div className="relative aspect-video w-full overflow-hidden bg-military-charcoal">
          {mission.diagramImage ? (
            <GitHubPagesImage
              src={mission.diagramImage}
              alt={`Схема расстановки — миссия «${mission.name}»`}
              fill
              className="object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <FactionLogoBadge faction={sideA} color={colorA.primary} />
              <span className="font-russo font-black text-military-amber/70 text-lg tracking-wider">VS</span>
              <FactionLogoBadge faction={sideB} color={colorB.primary} />
            </div>
          )}

          {/* Texture + bottom gradient for label legibility */}
          <div className="absolute inset-0 diagonal-stripes opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-military-dark via-military-dark/30 to-transparent" />

          {/* Classification stamp */}
          <div className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity">
            <div className="border-2 border-military-rust/60 px-1.5 py-0.5 rotate-[-8deg] backdrop-blur-sm bg-military-dark/40">
              <span className="font-ibm-mono text-[8px] text-military-rust tracking-wider">СЕКРЕТНО</span>
            </div>
          </div>

          {/* Campaign label */}
          {campaign && (
            <div className="absolute bottom-1.5 left-2">
              <span className="font-ibm-mono text-[9px] text-military-sand/70 uppercase tracking-wider bg-military-dark/50 px-1.5 py-0.5 rounded">
                {campaign.name}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="relative p-3 bg-military-dark/95">
          {/* Mission name */}
          <h3 className="font-russo font-bold text-white text-base sm:text-lg leading-tight mb-1 line-clamp-1 group-hover:text-military-amber transition-colors">
            {mission.name}
          </h3>

          {/* Unique per-mission summary */}
          <p className="font-oswald text-[12px] leading-snug text-military-taupe/85 mb-2.5 line-clamp-2 min-h-[2.5em]">
            {mission.summary || primaryObjective(mission)}
          </p>

          {/* Differentiating chips: turn count + first move (no duplicate faction chips) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-ibm-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-military-steel/15 text-military-sand/80 border border-military-steel/30 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {mission.parameters.turnCount ? `${mission.parameters.turnCount} ходов` : 'без лимита'}
            </span>
            {firstMoveName && (
              <span className="font-ibm-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-military-amber/10 text-military-amber/80 border border-military-amber/30 flex items-center gap-1">
                <Flag className="w-2.5 h-2.5" />
                1-й: {firstMoveName}
              </span>
            )}
          </div>
        </div>

        {/* Corner bracket accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-military-rust/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-military-rust/40" />
      </div>
    </Link>
  );
}

function FactionLogoBadge({ faction, color }: { faction: string; color: string }) {
  return (
    <div
      className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center backdrop-blur-md rounded-sm overflow-hidden"
      style={{ backgroundColor: `${color}26`, border: `1px solid ${color}` }}
    >
      <div className="absolute inset-1.5">
        <FactionLogo faction={faction} className="w-full h-full" />
      </div>
    </div>
  );
}

function primaryObjective(mission: Mission): string {
  const first = Object.values(mission.objectives)[0];
  return first?.text ?? '';
}
