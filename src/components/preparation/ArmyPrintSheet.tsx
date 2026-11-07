'use client';

import { Army, Machine, Squad } from '@/lib/types';
import { factionDisplayNames } from '@/lib/faction-colors';
import { getUnitEffectiveCost, recalculateArmyCost } from '@/lib/unit-utils';
import { collectSquadSpecialProps } from '@/lib/modifier-utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';

interface ArmyPrintSheetProps {
  army: Army;
  rulesLabel: string;
  machineDiscountActive?: boolean;
  /** Колонок карточек на листе: 1 / 2 / 3 (по умолчанию 2). */
  columns?: 1 | 2 | 3;
}

/**
 * Печатный арм-лист (A4, ч/б): невидим на экране (`hidden`), виден только
 * в @media print (`print:block`). Приоритет — уместить армию на ОДИН лист:
 * худший случай (6 отрядов × 6 бойцов) рассчитан фиксированной компактной
 * типографикой (~7.5pt) в двух колонках; юнит не рвётся между страницами.
 * Светлая тема и ноль цвета — печать в основном чёрно-белая.
 */
export function ArmyPrintSheet({ army, rulesLabel, machineDiscountActive = false, columns = 2 }: ArmyPrintSheetProps) {
  if (!army.units.length) return null;

  const total = recalculateArmyCost(army.units, { machineDiscountActive });
  const factionName = army.faction ? factionDisplayNames[army.faction] : '';
  const dateStr = new Date().toLocaleDateString('ru-RU');

  return (
    <div
      data-testid="army-print-sheet"
      className="hidden print:block bg-white text-black font-mono"
      aria-hidden={false}
    >
      {/* Шапка листа */}
      <div
        data-testid="print-header"
        className="flex items-baseline justify-between border-b-2 border-black pb-1.5 mb-2"
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-russo text-base uppercase tracking-wider truncate">
            {factionName}
          </span>
          <span className="text-[8pt] text-neutral-600 truncate">{rulesLabel}</span>
          {machineDiscountActive && (
            <span className="text-[8pt] text-neutral-600">−30% техника</span>
          )}
        </div>
        <div className="text-[9pt] whitespace-nowrap">
          {army.pointBudget ? `${total}/${army.pointBudget}` : total} очков
          <span className="text-[8pt] text-neutral-600 ml-2">{dateStr}</span>
        </div>
      </div>

      {/* Юниты в колонки (конфигурируется); блок юнита не рвётся между страницами */}
      <div
        data-testid="print-columns"
        className="[column-fill:balance]"
        style={{ columnCount: columns, columnGap: '0.75rem' }}
      >
        {army.units.map((unit) => {
          const isSquad = unit.type === 'squad';
          const title = unit.instanceNumber && unit.instanceNumber > 1
            ? `${unit.data.name} #${unit.instanceNumber}`
            : unit.data.name;
          const cost = getUnitEffectiveCost(unit, machineDiscountActive);

          return (
            <div
              key={unit.instanceId}
              data-testid={`print-unit-${unit.instanceId}`}
              className="break-inside-avoid mb-2"
            >
              {/* Заголовок юнита */}
              <div className="flex items-baseline justify-between bg-neutral-100 border border-neutral-300 px-1 py-0.5">
                <span className="font-russo text-[9pt] uppercase tracking-wide truncate">
                  {title}
                  {isSquad && collectSquadSpecialProps(unit.data as Squad).length > 0 && (
                    <span className="font-mono text-[7pt] normal-case ml-1 text-neutral-600 align-middle">
                      {' '}{collectSquadSpecialProps(unit.data as Squad).map((b) => b.name).join(' · ')}
                    </span>
                  )}
                </span>
                <span className="text-[9pt] font-bold whitespace-nowrap pl-1">{cost}</span>
              </div>

              {isSquad ? (
                <ArmyPrintSquad squad={unit.data as Squad} />
              ) : (
                <ArmyPrintMachine machine={unit.data as Machine} compact={columns === 3} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Отряд: миниатюры бойцов + таблица статов. */
function ArmyPrintSquad({ squad }: { squad: Squad }) {
  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1 flex-wrap">
        {squad.soldiers.map((soldier) => (
          <GitHubPagesImage
            key={soldier.num}
            src={soldier.image || squad.image || '/images/placeholder.png'}
            alt={`Боец ${soldier.num}`}
            width={44}
            height={58}
            unoptimized
            className="w-[15mm] h-[20mm] object-cover object-top border border-neutral-400"
          />
        ))}
      </div>
      <table className="w-full border-collapse text-[7.5pt] leading-tight">
        <thead>
          <tr className="border-b border-neutral-400 text-neutral-600 text-[6.5pt]">
            <th className="text-left py-px pr-1 font-normal">№</th>
            <th className="text-right py-px px-1 font-normal">Рг</th>
            <th className="text-right py-px px-1 font-normal">Ск</th>
            <th className="text-right py-px px-1 font-normal">Даль</th>
            <th className="text-right py-px px-1 font-normal">Мощ</th>
            <th className="text-right py-px px-1 font-normal">ББ</th>
            <th className="text-right py-px pl-1 font-normal">Бр</th>
          </tr>
        </thead>
        <tbody>
          {squad.soldiers.map((soldier) => (
            <tr key={soldier.num} className="border-b border-neutral-200">
              <td className="text-left py-px pr-1">{soldier.num ?? ''}</td>
              <td className="text-right py-px px-1">{soldier.rank}</td>
              <td className="text-right py-px px-1">{soldier.speed}</td>
              <td className="text-right py-px px-1">{soldier.range}</td>
              <td className="text-right py-px px-1">{soldier.power}</td>
              <td className="text-right py-px px-1">{soldier.melee}</td>
              <td className="text-right py-px pl-1">{soldier.armor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Машина: миниатюра + ключевые статы + таблица орудий.
 *  compact (3 колонки): блок строится вертикально, миниатюра меньше —
 *  иначе таблица орудий обрезается справа. */
function ArmyPrintMachine({ machine, compact = false }: { machine: Machine; compact?: boolean }) {
  const topSpeed = Math.max(...machine.speed_sectors.map((s) => s.speed), 0);

  return (
    <div className={compact ? 'mt-1' : 'mt-1 flex gap-1.5'}>
      {machine.image && (
        <GitHubPagesImage
          src={machine.image}
          alt={machine.name}
          width={compact ? 36 : 58}
          height={compact ? 36 : 58}
          unoptimized
          className={compact
            ? 'w-[12mm] h-[12mm] object-contain object-center border border-neutral-400 mb-0.5'
            : 'w-[20mm] h-[20mm] object-contain object-center border border-neutral-400 shrink-0'}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[7.5pt] leading-snug mb-0.5">
          <span className="text-neutral-600">Рг </span>{machine.rank}
          <span className="text-neutral-600"> · Б/с </span>{machine.fire_rate}
          <span className="text-neutral-600"> · Прч </span>{machine.durability_max}
          <span className="text-neutral-600"> · Ск </span>{topSpeed}
        </div>
        <table className="w-full border-collapse text-[7.5pt] leading-tight">
          <thead>
            <tr className="border-b border-neutral-400 text-neutral-600 text-[6.5pt]">
              <th className="text-left py-px pr-1 font-normal">Орудие</th>
              <th className="text-right py-px px-1 font-normal">Даль</th>
              <th className="text-right py-px px-1 font-normal">Мощ</th>
              <th className="text-right py-px pl-1 font-normal">БЗ</th>
            </tr>
          </thead>
          <tbody>
            {machine.weapons.map((weapon, i) => (
              <tr key={i} className="border-b border-neutral-200">
                <td className="text-left py-px pr-1 truncate max-w-[30mm]">{weapon.name}</td>
                <td className="text-right py-px px-1">{weapon.range === 'ББ' ? '—' : weapon.range}</td>
                <td className="text-right py-px px-1">{weapon.power}</td>
                <td className="text-right py-px pl-1">{weapon.ammo ?? machine.ammo_max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
