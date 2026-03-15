/**
 * Squad editor component - styled like battle cards with UX focus
 * Mobile-first responsive design with card-based soldier editing
 */

'use client';

import { useState } from 'react';
import { CustomSquad, CustomSource, CustomSoldier } from '@/lib/editor/types';
import { generateUnitId } from '@/lib/editor/id-generator';
import { getFactionColors } from '@/lib/faction-colors';
import { Save, X, Plus, Eye, Users, Target, Star } from 'lucide-react';
import { SoldiersTable } from './SoldiersTable';
import { SquadPreview } from './SquadPreview';
import { cn } from '@/lib/utils';

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
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
    ]
  );
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const colors = getFactionColors(factionId);

  const handleAddSoldier = () => {
    if (soldiers.length < 6) {
      setSoldiers([
        ...soldiers,
        { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
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
    };

    onSave(squadData);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header with tech corners - matching main app style */}
      <div className={cn(
        "relative px-4 py-4 border-b-2 bg-slate-900/80 backdrop-blur-sm shrink-0",
        colors.border
      )}>
        {/* Tech corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: colors.primary }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: colors.primary }} />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isOverride ? 'Переопределение отряда' : (squad ? 'Редактирование отряда' : 'Новый отряд')}
            </h2>
            {isOverride && (
              <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Замена базового юнита (ID останется прежним)
              </p>
            )}
          </div>
          <div className="flex gap-2">
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
              <Save className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Сохранить</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Mobile: Stacked layout, Desktop: Two-column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Left column: Basic info */}
            <div className="md:col-span-1 space-y-4">
              {/* Section: Basic Info */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 p-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50 mb-4">
                  <Target className={cn("w-4 h-4", colors.text)} />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Основное</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Название отряда *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:ring-1 transition-all",
                        errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                      )}
                      placeholder="Введите название"
                    />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Краткое название</label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      placeholder="Опционально"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">Отображается на карточке юнита</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Стоимость (очков) *</label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                      className={cn(
                        "w-full px-3 py-2 bg-slate-800 border rounded-lg focus:ring-1 transition-all",
                        errors.cost ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                      )}
                      min="0"
                    />
                    {errors.cost && <p className="text-xs text-red-400 mt-1">{errors.cost}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">URL изображения отряда</label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-xs"
                      placeholder="/images/squads/..."
                    />
                  </div>
                </div>
              </div>

              {/* Section: Stats Summary - styled like battle card */}
              <div className={cn(
                "rounded-lg border-2 overflow-hidden relative",
                colors.border
              )}>
                {/* Tech corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t -ml-px -mt-px pointer-events-none" style={{ borderColor: colors.primary }} />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t -mr-px -mt-px pointer-events-none" style={{ borderColor: colors.primary }} />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b -ml-px -mb-px pointer-events-none" style={{ borderColor: colors.primary }} />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b -mr-px -mb-px pointer-events-none" style={{ borderColor: colors.primary }} />

                <div className="bg-slate-900/80 px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className={cn("w-4 h-4", colors.text)} />
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Статистика</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className={cn("rounded-lg p-3", colors.bg, "border", colors.border)}>
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Солдат</div>
                      <div className="text-2xl font-bold text-white">{soldiers.length}</div>
                      <div className="text-[10px] text-slate-600">макс 6</div>
                    </div>
                    <div className={cn("rounded-lg p-3", colors.bg, "border", colors.border)}>
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Стоимость</div>
                      <div className={cn("text-2xl font-bold", colors.text)}>{cost}</div>
                      <div className="text-[10px] text-slate-600">очков</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview button - mobile styled */}
              <button
                onClick={() => setShowPreview(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 transition-all group"
              >
                <Eye className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-blue-300">Предпросмотр</span>
              </button>
            </div>

            {/* Right column: Soldiers editor - full width on mobile */}
            <div className={cn(
              "md:col-span-2 bg-slate-900/50 rounded-lg border border-slate-800/50 p-4",
              errors.soldiers && "border-red-500/50"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Users className={cn("w-4 h-4", colors.text)} />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Солдаты <span className="text-slate-500">({soldiers.length}/6)</span>
                  </h3>
                </div>
                <button
                  onClick={handleAddSoldier}
                  disabled={soldiers.length >= 6}
                  className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 transition-all disabled:opacity-50 group"
                  title="Добавить солдата"
                >
                  <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {errors.soldiers && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-600/30">
                  <p className="text-sm text-red-400">{errors.soldiers}</p>
                </div>
              )}

              {/* Legend for soldier properties */}
              <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-2 font-semibold">Обозначения свойств:</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                  <span><strong className="text-slate-400">Г</strong> — Граната</span>
                  <span><strong className="text-slate-400">БЫ</strong> — Медик</span>
                  <span><strong className="text-slate-400">П</strong> — Пилот</span>
                </div>
              </div>

              <SoldiersTable
                soldiers={soldiers}
                squadName={name || 'Новый отряд'}
                squadCost={cost}
                faction={factionId}
                onUpdate={handleUpdateSoldier}
                onRemove={handleRemoveSoldier}
              />
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
