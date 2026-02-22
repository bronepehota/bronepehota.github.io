'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { ArmyUnit, Squad, FactionID } from '@/lib/types'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFactionColors } from '@/lib/faction-colors'

interface UnitNavigationCardProps {
  unit: ArmyUnit
  originalIndex: number
  isActive: boolean
  isDone: boolean
  isDead: boolean
  isMachine: boolean
  onClick: () => void
  faction: FactionID
  dockStyles: ReturnType<typeof getUnitDockStyles>
}

function getUnitDockStyles(factionId: string) {
  const colors = getFactionColors(factionId as FactionID)
  return {
    primary: colors.borderSolid,
    primaryBg: colors.bgSolid,
    muted: colors.border,
    mutedBg: colors.bg,
    text: colors.text,
    activeGlow: colors.glow,
    accent: colors.accent
  }
}

function UnitNavigationCard({
  unit,
  originalIndex,
  isActive,
  isDone,
  isDead,
  isMachine,
  onClick,
  faction,
  dockStyles,
}: UnitNavigationCardProps) {
  const unitNumber = originalIndex + 1
  const unitData = unit.data

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative h-20 w-[72px] flex-shrink-0 rounded-lg border-2 bg-slate-800/50 p-0.5 transition-all md:h-24 md:w-[88px]',
        isActive && `${dockStyles.primary} shadow-lg scale-105`,
        !isActive && 'border-slate-700 opacity-60 hover:opacity-100'
      )}
      aria-label={`Unit ${unitNumber}`}
    >
      {/* Unit Image */}
      <div className="relative h-full w-full overflow-hidden rounded bg-slate-900">
        <Image
          src={
            isMachine
              ? unitData.image!
              : ((unitData as Squad).soldiers[0]?.image || unitData.image!)
          }
          alt={unitData.name}
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 72px, 88px"
        />
      </div>

      {/* Active Overlay */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
      )}

      {/* Dead Overlay */}
      {isDead && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
          <X className={cn('h-8 w-8 md:h-10 md:w-10', dockStyles.text)} strokeWidth={3} />
        </div>
      )}

      {/* Done Badge */}
      {isDone && !isDead && (
        <div className="absolute top-0 right-0 p-1">
          <div className={cn('rounded-full p-0.5 shadow-md', dockStyles.primaryBg)}>
            <Check className="h-3 w-3 text-slate-900" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Corner Accents for Active Unit */}
      {isActive && (
        <>
          <div className={cn('absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2', dockStyles.primary)} />
          <div className={cn('absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2', dockStyles.primary)} />
          <div className={cn('absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2', dockStyles.primary)} />
          <div className={cn('absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2', dockStyles.primary)} />
        </>
      )}

      {/* Unit Number Badge */}
      <div className="absolute bottom-0 left-0 px-1.5 py-0.5 bg-slate-900/90 rounded-tr-lg border-r border-t border-slate-700">
        <span className="text-xs font-bold text-slate-300">{unitNumber}</span>
      </div>

      {/* Machine Indicator */}
      {isMachine && (
        <div className="absolute top-0 left-0 px-1 py-0.5 bg-slate-900/90 rounded-br-lg border-r border-b border-slate-700">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
        </div>
      )}
    </button>
  )
}

// Custom comparison function to prevent unnecessary re-renders
function arePropsEqual(
  prevProps: UnitNavigationCardProps,
  nextProps: UnitNavigationCardProps
): boolean {
  return (
    prevProps.unit.instanceId === nextProps.unit.instanceId &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isDone === nextProps.isDone &&
    prevProps.isDead === nextProps.isDead
  )
}

export default memo(UnitNavigationCard, arePropsEqual)
