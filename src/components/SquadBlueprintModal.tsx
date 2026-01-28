'use client';

import { X, ExternalLink, Shield, Target, Zap, ChevronLeft, Sword } from 'lucide-react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import type { Squad } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SquadBlueprintModalProps {
  squad: Squad;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (squad: Squad) => void;
}

export default function SquadBlueprintModal({
  squad,
  isOpen,
  onClose,
  onAdd
}: SquadBlueprintModalProps) {
  if (!isOpen) return null;

  const getFactionColor = () => {
    const colorMap = {
      polaris: {
        primary: 'text-red-400',
        border: 'border-red-600/40',
        bg: 'bg-red-950/20',
        accent: 'border-red-500'
      },
      protectorate: {
        primary: 'text-cyan-400',
        border: 'border-cyan-600/40',
        bg: 'bg-cyan-950/20',
        accent: 'border-cyan-500'
      },
      mercenaries: {
        primary: 'text-yellow-400',
        border: 'border-yellow-600/40',
        bg: 'bg-yellow-950/20',
        accent: 'border-yellow-500'
      }
    };
    return colorMap[squad.faction as keyof typeof colorMap] || colorMap.polaris;
  };

  const colors = getFactionColor();

  const getSoldierStats = () => {
    const ranks = squad.soldiers.map(s => s.rank).filter(r => r >= 0);
    const minRank = ranks.length > 0 ? Math.min(...ranks) : 'Н/Д';
    const maxRank = ranks.length > 0 ? Math.max(...ranks) : 'Н/Д';

    const speeds = squad.soldiers.map(s => s.speed).filter(s => s >= 0);
    const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 'Н/Д';
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 'Н/Д';

    const armors = squad.soldiers.map(s => s.armor).filter(a => a >= 0);
    const minArmor = armors.length > 0 ? Math.min(...armors) : 'Н/Д';
    const maxArmor = armors.length > 0 ? Math.max(...armors) : 'Н/Д';

    const melees = squad.soldiers.map(s => s.melee).filter(m => m >= 0);
    const avgMelee = melees.length > 0 ? (melees.reduce((a, b) => a + b, 0) / melees.length).toFixed(1) : 'Н/Д';

    // Для дальности и мощьности - находим минимальное и максимальное значения
    const rangeValues = squad.soldiers
      .map(s => {
        if (!s.range) return null;
        // Парсим значения типа "D6", "D12+2", "2D6"
        const match = s.range.match(/(\d*)D(\d+)(?:\+(\d+))?/);
        if (match) {
          const count = parseInt(match[1]) || 1;
          const sides = parseInt(match[2]);
          const bonus = parseInt(match[3]) || 0;
          const min = count + bonus;
          const max = count * sides + bonus;
          return { min, max, display: s.range };
        }
        return null;
      })
      .filter(Boolean);

    const powerValues = squad.soldiers
      .map(s => {
        if (!s.power) return null;
        // Парсим значения типа "D6", "D12+2", "2D6", "ББ"
        if (s.power === 'ББ') return { min: 0, max: 0, display: 'ББ' };
        const match = s.power.match(/(\d*)D(\d+)(?:\+(\d+))?/);
        if (match) {
          const count = parseInt(match[1]) || 1;
          const sides = parseInt(match[2]);
          const bonus = parseInt(match[3]) || 0;
          const min = count + bonus;
          const max = count * sides + bonus;
          return { min, max, display: s.power };
        }
        return null;
      })
      .filter(Boolean);

    // Формируем строки для отображения
    const getRangeDisplay = () => {
      if (rangeValues.length === 0) return 'Н/Д';
      const allSame = rangeValues.every(v => v && rangeValues[0] && v.display === rangeValues[0].display);
      if (allSame && rangeValues[0]) return rangeValues[0].display;
      const min = Math.min(...rangeValues.map(v => v?.min ?? 0));
      const max = Math.max(...rangeValues.map(v => v?.max ?? 0));
      return `${min}-${max}`;
    };

    const getPowerDisplay = () => {
      if (powerValues.length === 0) return 'Н/Д';
      const allSame = powerValues.every(v => v && powerValues[0] && v.display === powerValues[0].display);
      if (allSame && powerValues[0]) return powerValues[0].display;
      const min = Math.min(...powerValues.map(v => v?.min ?? 0));
      const max = Math.max(...powerValues.map(v => v?.max ?? 0));
      return `${min}-${max}`;
    };

    const allProps = squad.soldiers.flatMap(s => s.props || []);
    const uniqueProps = Array.from(new Set(allProps));

    return {
      minRank,
      maxRank,
      minSpeed,
      maxSpeed,
      avgRange: getRangeDisplay(),
      avgPower: getPowerDisplay(),
      avgMelee,
      minArmor,
      maxArmor,
      uniqueProps
    };
  };

  const stats = getSoldierStats();

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className={cn(
          "w-full sm:max-w-[600px] bg-slate-900/90 backdrop-blur-sm border-t-2 sm:border-2 shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col relative",
          colors.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner accents */}
        <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 z-10", colors.accent)} />
        <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 z-10", colors.accent)} />
        <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 z-10", colors.accent)} />
        <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 z-10", colors.accent)} />

        {/* Tech Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-800/50 shrink-0 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/80 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700/50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className={cn("font-mono font-bold text-sm sm:text-base uppercase tracking-wider truncate", colors.primary)}>
                {squad.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className={cn("px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono border rounded-sm", colors.border, colors.bg, colors.primary)}>
                  {Math.max(...squad.soldiers.map(s => s.rank))}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">
                  {squad.cost} ОЧК.
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/80 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700/50"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Image with tech frame */}
          <div className="relative h-40 sm:h-48 bg-slate-800/50 rounded-sm overflow-hidden border-2 border-slate-700/50">
            <Image
              src={squad.image || '/images/soldiers/empty.png'}
              alt={squad.name}
              width={400}
              height={300}
              className="w-full h-full object-cover scale-125"
              unoptimized
              style={{ objectPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            {/* Tech overlay corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-slate-600/30" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-slate-600/30" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-slate-600/30" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-slate-600/30" />
          </div>

          {/* Description */}
          {squad.originalUrl && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-sm p-3 relative">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-slate-600/40" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-slate-600/40" />
              <p className="text-sm text-slate-300 leading-relaxed">
                Историческая справка о данном подразделении
              </p>
              <a
                href={squad.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Источник
              </a>
            </div>
          )}

          {/* Технические характеристики отряда */}
          <div>
            <h3 className={cn('font-mono text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Состав отряда
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">РАНГ</span>
                <span className={cn('text-sm font-mono', colors.primary)}>
                  {typeof stats.minRank === 'number' && typeof stats.maxRank === 'number'
                    ? stats.minRank === stats.maxRank
                      ? `${stats.minRank}`
                      : `${stats.minRank}-${stats.maxRank}`
                    : 'Н/Д'}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">БРОНЯ</span>
                <span className="text-sm text-slate-300">
                  {typeof stats.minArmor === 'number' && typeof stats.maxArmor === 'number'
                    ? stats.minArmor === stats.maxArmor
                      ? `${stats.minArmor}`
                      : `${stats.minArmor}-${stats.maxArmor}`
                    : 'Н/Д'}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">СКОРОСТЬ</span>
                <span className="text-sm text-slate-300">
                  {typeof stats.minSpeed === 'number' && typeof stats.maxSpeed === 'number'
                    ? stats.minSpeed === stats.maxSpeed
                      ? `${stats.minSpeed}`
                      : `${stats.minSpeed}-${stats.maxSpeed}`
                    : 'Н/Д'}
                </span>
              </div>
            </div>
          </div>

          {/* Вооружение и характеристики */}
          <div>
            <h3 className={cn('font-mono text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Характеристики бойцов
            </h3>
            <div className="space-y-2">
              {squad.soldiers.map((soldier, index) => (
                <div key={index} className="bg-slate-900/60 border border-slate-700/50 rounded-sm overflow-hidden">
                  <div className="flex">
                    {/* Soldier image */}
                    <div className="w-20 h-20 bg-slate-800/50 flex-shrink-0 relative">
                      {soldier.image ? (
                        <div className="w-full h-full relative overflow-hidden">
                          <Image
                            src={soldier.image}
                            alt={`Боец ${soldier.num || index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover scale-150"
                            unoptimized
                            style={{ objectPosition: 'center' }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shield className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Soldier info */}
                    <div className="flex-1 px-3 py-2 min-w-0">
                      <div className="flex items-center mb-2">
                        <span className={cn('text-xs font-mono font-bold', colors.primary)}>
                          Боец #{soldier.num || index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="text-[8px] text-slate-500 font-mono uppercase">Дальн</div>
                          <div className="text-xs text-green-400 font-mono">{soldier.range || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 font-mono uppercase">Мощн</div>
                          <div className="text-xs text-orange-400 font-mono">{soldier.power || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 font-mono uppercase">ББ</div>
                          <div className="text-xs text-slate-300 font-mono">{soldier.melee}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 font-mono uppercase">Броня</div>
                          <div className="text-xs text-slate-300 font-mono">{soldier.armor}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Special properties */}
                  {soldier.props && soldier.props.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-3 pb-2">
                      {soldier.props.map((prop, propIndex) => (
                        <span key={propIndex} className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                          {prop}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Особые свойства */}
          {stats.uniqueProps.length > 0 && (
            <div>
              <h3 className={cn('font-mono text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Особые свойства ({stats.uniqueProps.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.uniqueProps.map((prop, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2"
                  >
                    <span className={cn("text-sm font-mono", colors.primary)}>{prop}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions - Tech Controls */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 px-3 py-2 sm:px-4 sm:py-3 flex gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onClose}
            className={cn(
              "px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-700 font-mono text-xs sm:text-sm hover:bg-slate-800/60 transition-colors rounded-sm min-h-[44px]",
              onAdd ? "flex-1" : "w-full"
            )}
          >
            ЗАКРЫТЬ
          </button>
          {onAdd && (
            <button
              onClick={() => onAdd(squad)}
              className={cn(
                'flex-1 px-3 py-2.5 sm:px-4 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider',
                'border-2 transition-all hover:scale-[1.02] active:scale-95 rounded-sm min-h-[44px]',
                colors.border,
                colors.bg,
                colors.primary
              )}
            >
              В АРМИЮ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}