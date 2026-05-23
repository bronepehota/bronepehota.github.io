/**
 * Squad editor component - desktop layout
 * Fixed sidebar (300px) + flexible soldiers area
 */

'use client';

import { useState } from 'react';
import { CustomSquad, CustomSource, CustomSoldier } from '@/lib/editor/types';
import { generateUnitId } from '@/lib/editor/id-generator';
import { getFactionColors } from '@/lib/faction-colors';
import { Save, X, Plus, Eye, Users, Star, ImageIcon } from 'lucide-react';
import { SoldiersTable } from './SoldiersTable';
import { SoldiersCalculator } from './SoldiersCalculator';
import { SquadPreview } from './SquadPreview';
import { BuffSelector } from './BuffSelector';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { cn } from '@/lib/utils';
import type { BuffDefinition } from '@/lib/modifier-types';
import type { CalculatorSoldierParams, CalculatedSoldier } from '@/lib/calculator-engine';

const DEFAULT_CALC_PARAMS: CalculatorSoldierParams = {
  race: 'human',
  squadType: 'shock',
  armor: 'clothing',
  weapon: 'pistol',
  twoWeapons: false,
  meleeWeapon: 'unarmed',
  property: null,
};

interface SquadEditorProps {
  squad?: CustomSquad;
  source: CustomSource;
  factionId: string;
  isOverride?: boolean;
  onSave: (squad: CustomSquad) => void;
  onCancel: () => void;
}

export function SquadEditor({ squad, source: _source, factionId, isOverride = false, onSave, onCancel }: SquadEditorProps) {
  const [name, setName] = useState(squad?.name || '');
  const [shortName, setShortName] = useState(squad?.shortName || '');
  const [cost, setCost] = useState(squad?.cost || 100);
  const [image, setImage] = useState(squad?.image || '');
  const [soldiers, setSoldiers] = useState<CustomSoldier[]>(
    squad?.soldiers || [
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
    ]
  );
  const [buffs, setBuffs] = useState<BuffDefinition[]>(squad?.buffs || []);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'manual' | 'calculator'>('manual');
  const [calcParams, setCalcParams] = useState<CalculatorSoldierParams[]>(
    () => squad?.soldiers?.length
      ? squad.soldiers.map(s => ({
          race: 'human',
          squadType: 'shock',
          armor: 'clothing',
          weapon: 'pistol',
          twoWeapons: false,
          meleeWeapon: 'unarmed',
          property: (s.modifiers || []).find(m =>
            m === 'mechanic' || m === 'jump_boost_3' || m === 'jump_boost_4' || m === 'jump_boost_5'
          ) ?? null,
          image: s.image,
        }))
      : [DEFAULT_CALC_PARAMS]
  );

  const colors = getFactionColors(factionId);

  const handleAddSoldier = () => {
    if (soldiers.length < 6) {
      setSoldiers([
        ...soldiers,
        { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
      ]);
    }
  };

  const handleRemoveSoldier = (index: number) => {
    if (soldiers.length > 1) {
      setSoldiers(soldiers.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSoldier = (index: number, updates: Partial<CustomSoldier>) => {
    setSoldiers(soldiers.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Введите название отряда';
    }

    if (cost < 0) {
      newErrors.cost = 'Стоимость не может быть отрицательной';
    }

    if (soldiers.length === 0) {
      newErrors.soldiers = 'Добавьте хотя бы одного солдата';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const squadData: CustomSquad = {
      id: squad?.id || generateUnitId(factionId, name),
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      faction: factionId,
      cost,
      image: image.trim() || undefined,
      soldiers,
      buffs: buffs.length > 0 ? buffs : undefined,
    };

    onSave(squadData);
  };

  const inputClass = "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:ring-1 transition-all text-sm";

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className={cn(
        "relative px-4 py-3 border-b-2 bg-slate-900/80 backdrop-blur-sm shrink-0",
        colors.border
      )}>
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: colors.primary }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: colors.primary }} />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {isOverride ? 'Переопределение отряда' : (squad ? 'Редактирование отряда' : 'Новый отряд')}
            </h2>
            {isOverride && (
              <p className="text-xs text-orange-400 mt-0.5 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Замена базового юнита (ID останется прежним)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick stats in header */}
            <div className="flex items-center gap-3 mr-3 text-xs text-slate-500">
              <span className={cn("px-2 py-1 rounded-md border", colors.bg, colors.border)}>
                {soldiers.length} <span className="text-slate-600 ml-0.5">солд.</span>
              </span>
              <span className={cn("px-2 py-1 rounded-md border", colors.bg, colors.border)}>
                {cost} <span className="text-slate-600 ml-0.5">очк.</span>
              </span>
            </div>
            <button
              onClick={() => setShowPreview(true)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
              title="Предпросмотр"
            >
              <Eye className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
              title="Отмена"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all font-semibold text-white shadow-lg shadow-emerald-900/20"
              title="Сохранить"
            >
              <Save className="w-4 h-4 mr-1.5 inline" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content - fluid width, no max-w constraint */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex gap-6">
            {/* Sidebar: basic info */}
            <div className="w-[300px] shrink-0 space-y-4">
              {/* Basic info card */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: colors.primary }} />
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Основное</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Название отряда *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      inputClass,
                      errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                    )}
                    placeholder="Введите название"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Краткое название</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className={cn(inputClass, "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20")}
                    placeholder="Опционально"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">На карточке юнита</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Стоимость (очков) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cost}
                    onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                    className={cn(
                      inputClass,
                      errors.cost ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                    )}
                  />
                  {errors.cost && <p className="text-xs text-red-400 mt-1">{errors.cost}</p>}
                </div>

                {/* Image URL - collapsible help */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Изображение</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-xs"
                        placeholder="/images/squads/..."
                      />
                    </div>
                    {image ? (
                      <div className="relative w-64 aspect-[3/4] rounded-lg border border-slate-700 overflow-hidden bg-slate-800 shadow-md">
                        <GitHubPagesImage
                          src={image}
                          alt=""
                          fill
                          className="object-cover object-center"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-64 aspect-[3/4] rounded-lg border border-slate-700/50 border-dashed bg-slate-800/30 flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                        <span className="text-[10px] text-slate-600">Нет изображения</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buffs section */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
                  <div className="w-1 h-4 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Бафы</h3>
                  {buffs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                      {buffs.length}
                    </span>
                  )}
                </div>
                <BuffSelector selectedBuffs={buffs} onChange={setBuffs} />
              </div>
            </div>

            {/* Main content: soldiers - fluid width */}
            <div className={cn(
              "flex-1 min-w-0 bg-slate-900/50 rounded-lg border border-slate-800/50 p-4",
              errors.soldiers && "border-red-500/50"
            )}>
              {/* Soldiers header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Users className={cn("w-4 h-4", colors.text)} />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Солдаты <span className="text-slate-500">({soldiers.length}/6)</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* Tab switcher */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMode('manual')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        mode === 'manual'
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                          : "text-slate-500 hover:text-slate-400 border border-transparent"
                      )}
                      data-testid="manual-tab"
                    >
                      Ручной ввод
                    </button>
                    <button
                      onClick={() => setMode('calculator')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        mode === 'calculator'
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                          : "text-slate-500 hover:text-slate-400 border border-transparent"
                      )}
                      data-testid="calculator-tab"
                    >
                      Калькулятор
                    </button>
                  </div>
                  {mode === 'manual' && (
                    <button
                      onClick={handleAddSoldier}
                      disabled={soldiers.length >= 6}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/20 text-xs text-emerald-400 transition-all disabled:opacity-40"
                      title="Добавить солдата"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Добавить солдата
                    </button>
                  )}
                </div>
              </div>

              {errors.soldiers && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-600/30">
                  <p className="text-sm text-red-400">{errors.soldiers}</p>
                </div>
              )}

              {mode === 'manual' ? (
                <SoldiersTable
                  soldiers={soldiers}
                  squadName={name || 'Новый отряд'}
                  squadCost={cost}
                  faction={factionId}
                  onUpdate={handleUpdateSoldier}
                  onRemove={handleRemoveSoldier}
                />
              ) : (
                <SoldiersCalculator
                  params={calcParams}
                  onParamsChange={setCalcParams}
                  onApply={(calculatedSoldiers: CalculatedSoldier[], squadCost: number) => {
                    const newSoldiers = calcParams.map((cp, idx) => {
                      const cs = calculatedSoldiers[idx];
                      const modifiers: string[] = [];
                      if (cp.property) {
                        modifiers.push(cp.property);
                      }
                      return {
                        rank: cs.rank,
                        speed: cs.speed,
                        range: cs.range,
                        power: cs.power,
                        melee: cs.melee,
                        armor: cs.armor,
                        image: cp.image || undefined,
                        modifiers,
                      };
                    });
                    setSoldiers(newSoldiers);
                    setCost(squadCost);
                    setMode('manual');
                  }}
                  onAddSoldier={() => {
                    if (calcParams.length < 6) {
                      setCalcParams([...calcParams, DEFAULT_CALC_PARAMS]);
                    }
                  }}
                  onRemoveSoldier={(idx: number) => {
                    if (calcParams.length > 1) {
                      setCalcParams(calcParams.filter((_, i) => i !== idx));
                    }
                  }}
                  soldierCount={calcParams.length}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 z-10">
              <h2 className="text-lg font-semibold text-white">Предпросмотр отряда</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <SquadPreview
                soldiers={soldiers}
                squadName={name || 'Новый отряд'}
                squadCost={cost}
                faction={factionId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
