'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Target, Clock, Compass } from 'lucide-react';
import { clsx } from 'clsx';
import type { Mission, Campaign } from '@/lib/mission-types';
import { factionDisplayNames } from '@/lib/faction-colors';
import {
  getAllMissions,
  getAllCampaigns,
  FREE_PLAY_MISSION_ID,
  missionHasAnyParticipants,
} from '@/lib/missions-registry';
import { FloatingContinueButton } from '../controls/FloatingContinueButton';

interface MissionSelectorProps {
  selectedMissionId: string | null;
  onSelect: (missionId: string) => void;
  onConfirm?: () => void;
}

const ACCENT = '#f59e0b'; // amber — shared accent for the mission step

interface Option {
  id: string;
  name: string;
  subtitle: string;
  detail: string;
  detailExtra?: string;
  href?: string;
}

function toOptions(missions: Mission[]): Option[] {
  return missions.map((m) => {
    const firstObjective = Object.values(m.objectives)[0];
    const sides = m.factions.map((f) => factionDisplayNames[f] ?? f).join(' vs ');
    const turns = m.parameters.turnCount ? `${m.parameters.turnCount} ходов` : 'без лимита';
    return {
      id: m.id,
      name: m.name,
      subtitle: `${sides} · ${turns}`,
      detail: m.tagline || firstObjective?.text || '',
      detailExtra: m.parameters.firstMove
        ? `Первый ход: ${factionDisplayNames[m.parameters.firstMove] ?? m.parameters.firstMove}`
        : undefined,
      href: `/encyclopedia/mission/${m.id}`,
    };
  });
}

function OptionCard({
  option,
  icon,
  isSelected,
  isExpanded,
  onClick,
  onKeyDown,
}: {
  option: Option;
  icon: 'target' | 'compass';
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-expanded={isExpanded}
      onClick={onClick}
      onKeyDown={onKeyDown}
      data-testid={`mission-card-${option.id}`}
      className={clsx(
        'relative group transition-all duration-200 rounded-lg border',
        isSelected ? 'ring-1' : 'hover:border-slate-600',
      )}
      style={{
        borderColor: isSelected ? ACCENT : '#334155',
        backgroundColor: isSelected ? `${ACCENT}10` : 'rgba(30, 41, 59, 0.6)',
      }}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          <div
            className={clsx(
              'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
            )}
            style={{ borderColor: isSelected ? ACCENT : '#475569' }}
          >
            {isSelected && (
              <svg className="w-3 h-3" style={{ color: ACCENT }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          <div className="flex items-center gap-2">
            {icon === 'target' ? (
              <Target className="w-4 h-4 text-amber-400/70" />
            ) : (
              <Compass className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <h3
                className={clsx('font-mono font-bold text-sm tracking-wide', isSelected ? '' : 'text-slate-400')}
                style={isSelected ? { color: ACCENT } : undefined}
              >
                {option.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{option.subtitle}</p>
            </div>
          </div>
        </div>

        <svg
          className={clsx('w-4 h-4 text-slate-500 transition-transform duration-200', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
          {option.detail && <p className="text-xs text-slate-400 leading-relaxed mb-2">{option.detail}</p>}
          {option.detailExtra && (
            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {option.detailExtra}
            </p>
          )}
          {option.href && (
            <Link
              href={option.href}
              target="_blank"
              className="text-xs text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              Подробнее →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function MissionSelector({ selectedMissionId, onSelect, onConfirm }: MissionSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const missions = getAllMissions();
  const campaigns: Campaign[] = getAllCampaigns();
  const options = toOptions(missions);

  // Default selection: free play. Null/undefined → treat as free play selected.
  const effectiveSelected = selectedMissionId ?? FREE_PLAY_MISSION_ID;

  // Auto-expand the selected option on mount
  useEffect(() => {
    setExpandedId(effectiveSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (id: string) => {
    onSelect(id);
    setExpandedId(id === expandedId ? null : id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(id);
    } else if (e.key === 'Escape' && expandedId === id) {
      setExpandedId(null);
    }
  };

  const freePlayOption: Option = {
    id: FREE_PLAY_MISSION_ID,
    name: 'Свободная игра',
    subtitle: 'Без сценария',
    detail: 'Сражение без специальной миссии: цели и ходы определяете сами.',
  };

  // Participant-less missions cluster with free play (both = "bring your own army");
  // the rest are grouped by campaign.
  const freeBuildOptions = options.filter((o) => {
    const m = missions.find((mm) => mm.id === o.id);
    return m ? !missionHasAnyParticipants(m) : false;
  });
  const campaignOptions = options.filter(
    (o) => !freeBuildOptions.some((f) => f.id === o.id),
  );

  // Group campaign missions by campaign (preserving campaign order; unknown → "Прочие")
  const groups = campaigns
    .map((c) => ({ campaign: c, options: campaignOptions.filter((o) => missions.find((m) => m.id === o.id)?.campaign === c.id) }))
    .filter((g) => g.options.length > 0);
  const uncategorized = campaignOptions.filter(
    (o) => !campaigns.some((c) => missions.find((m) => m.id === o.id)?.campaign === c.id),
  );

  return (
    <>
      <div id="mission-selector" className="space-y-4 max-w-2xl mx-auto pb-32">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-px flex-1 bg-slate-700/50" />
          <span className="text-lg font-bold text-slate-300 font-mono tracking-wider">МИССИЯ</span>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        {/* Free play + build-your-own-army scenarios — clustered, no divider between them */}
        <div className="space-y-2">
          <OptionCard
            option={freePlayOption}
            icon="compass"
            isSelected={effectiveSelected === FREE_PLAY_MISSION_ID}
            isExpanded={expandedId === FREE_PLAY_MISSION_ID}
            onClick={() => handleClick(FREE_PLAY_MISSION_ID)}
            onKeyDown={(e) => handleKeyDown(e, FREE_PLAY_MISSION_ID)}
          />
          {freeBuildOptions.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              icon="target"
              isSelected={effectiveSelected === option.id}
              isExpanded={expandedId === option.id}
              onClick={() => handleClick(option.id)}
              onKeyDown={(e) => handleKeyDown(e, option.id)}
            />
          ))}
        </div>

        {/* Grouped missions */}
        {groups.map((group) => (
          <div key={group.campaign.id}>
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-amber-500/30" />
              <span className="text-sm font-semibold text-amber-400 font-mono tracking-wider">
                НАБОР СЦЕНАРИЕВ «{group.campaign.name}»
              </span>
              <div className="h-px flex-1 bg-amber-500/30" />
            </div>
            <div className="space-y-2">
              {group.options.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  icon="target"
                  isSelected={effectiveSelected === option.id}
                  isExpanded={expandedId === option.id}
                  onClick={() => handleClick(option.id)}
                  onKeyDown={(e) => handleKeyDown(e, option.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div className="space-y-2">
            {uncategorized.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                icon="target"
                isSelected={effectiveSelected === option.id}
                isExpanded={expandedId === option.id}
                onClick={() => handleClick(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
              />
            ))}
          </div>
        )}
      </div>

      {onConfirm && (
        <FloatingContinueButton
          text="Продолжить"
          tooltip="К сбору армии"
          accentColor={ACCENT}
          onClick={onConfirm}
          dataTestid="mission-confirm-button"
          icon={<ArrowRight className="w-4 h-4" />}
        />
      )}
    </>
  );
}
