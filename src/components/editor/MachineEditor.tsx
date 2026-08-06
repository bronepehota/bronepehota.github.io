/**
 * Machine editor component - styled like battle cards with UX focus
 */

'use client';

import { useState } from 'react';
import { CustomMachine, CustomSource, CustomWeapon, CustomSpeedSector } from '@/lib/editor/types';
import { generateUnitId } from '@/lib/editor/id-generator';
import { Save, X, Plus, Trash2, Eye, Target, Zap, Shield, Gauge } from 'lucide-react';
import { MachinePreview } from './MachinePreview';
import { BuffSelector } from './BuffSelector';
import { MachineCalculator } from './MachineCalculator';
import { machineCost, deriveSpeedSectors } from '@/lib/machine-calculator-engine';
import type { BuffDefinition } from '@/lib/modifier-types';
import type { MachineCalculatorParams, WeaponSlotConfig } from '@/lib/editor/types';

interface MachineEditorProps {
  machine?: CustomMachine;
  source: CustomSource;
  factionId: string;
  isOverride?: boolean;
  onSave: (machine: CustomMachine) => void;
  onCancel: () => void;
}

// Get faction styling
function getFactionStyle(factionId: string) {
  const styles: Record<string, { border: string; glow: string; bg: string; text: string; corner: string; badge: string }> = {
    polaris: {
      border: 'border-red-600/30',
      glow: 'shadow-red-900/20',
      bg: 'bg-red-950/20',
      text: 'text-red-400',
      corner: 'rgba(220, 38, 38, 0.6)',
      badge: 'bg-red-950/90 text-red-400 border-red-600/40',
    },
    protectorate: {
      border: 'border-cyan-600/30',
      glow: 'shadow-cyan-900/20',
      bg: 'bg-cyan-950/20',
      text: 'text-cyan-400',
      corner: 'rgba(8, 145, 178, 0.6)',
      badge: 'bg-cyan-950/90 text-cyan-400 border-cyan-600/40',
    },
    mercenaries: {
      border: 'border-yellow-600/30',
      glow: 'shadow-yellow-900/20',
      bg: 'bg-yellow-950/20',
      text: 'text-yellow-400',
      corner: 'rgba(202, 138, 4, 0.6)',
      badge: 'bg-yellow-950/90 text-yellow-400 border-yellow-600/40',
    },
  };
  return styles[factionId] || styles.mercenaries;
}

export function MachineEditor({ machine, source: _source, factionId, isOverride = false, onSave, onCancel }: MachineEditorProps) {
  const [name, setName] = useState(machine?.name || '');
  const [shortName, setShortName] = useState(machine?.shortName || '');
  const [cost, setCost] = useState(machine?.cost || 200);
  const [rank, setRank] = useState(machine?.rank || 2);
  const [fireRate, setFireRate] = useState(machine?.fire_rate || 2);
  const [ammoMax, setAmmoMax] = useState(machine?.ammo_max || 20);
  const [durabilityMax, setDurabilityMax] = useState(machine?.durability_max || 16);
  const [image, setImage] = useState(machine?.image || '');
  const [weapons, setWeapons] = useState<CustomWeapon[]>(
    machine?.weapons || [{ name: 'Main Gun', range: 'D12', power: '2D20' }]
  );
  const [speedSectors, setSpeedSectors] = useState<CustomSpeedSector[]>(
    machine?.speed_sectors || [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 },
    ]
  );
  const [buffs, setBuffs] = useState<BuffDefinition[]>(machine?.buffs || []);
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<'calculator' | 'manual'>(
    machine?.calculatorParams ? 'calculator' : 'manual'
  );
  const [calcParams, setCalcParams] = useState<MachineCalculatorParams>(
    machine?.calculatorParams ?? {
      monoblock: 'УМ-1',
      chassis: 'Шагатель',
      slots: Array.from({ length: 5 }, () => ({ preset: 'empty', range: '', power: '', ammo: 0, property: null })) as WeaponSlotConfig[],
    }
  );

  const factionStyle = getFactionStyle(factionId);

  const handleAddWeapon = () => {
    if (weapons.length < 4) {
      setWeapons([...weapons, { name: 'New Weapon', range: 'D6', power: '1D6' }]);
    }
  };

  const handleRemoveWeapon = (index: number) => {
    if (weapons.length > 1) {
      setWeapons(weapons.filter((_, i) => i !== index));
    }
  };

  const handleUpdateWeapon = (index: number, updates: Partial<CustomWeapon>) => {
    setWeapons(weapons.map((w, i) => (i === index ? { ...w, ...updates } : w)));
  };

  // Speed sector handlers
  const handleAddSpeedSector = () => {
    if (speedSectors.length < 6) {
      const lastSector = speedSectors[speedSectors.length - 1];
      const newMin = lastSector ? lastSector.max_durability + 1 : 1;
      const newMax = lastSector ? lastSector.max_durability + 5 : 5;
      setSpeedSectors([
        ...speedSectors,
        { min_durability: newMin, max_durability: newMax, speed: 1 }
      ]);
    }
  };

  const handleRemoveSpeedSector = (index: number) => {
    if (speedSectors.length > 1) {
      setSpeedSectors(speedSectors.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSpeedSector = (index: number, updates: Partial<CustomSpeedSector>) => {
    setSpeedSectors(speedSectors.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleApplyCost = (cost: number) => {
    setCost(cost);
    const bd = machineCost(calcParams);
    setDurabilityMax(bd.derived.durability_max);
    setAmmoMax(bd.derived.ammo_max);
    setRank(bd.derived.rank);
    setFireRate(bd.derived.fire_rate);
    setSpeedSectors(deriveSpeedSectors(calcParams.monoblock, calcParams.chassis, bd.derived.durability_max));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название техники');
      return;
    }

    const machineData: CustomMachine = {
      id: machine?.id || generateUnitId(factionId, name),
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      faction: factionId,
      cost,
      rank,
      fire_rate: fireRate,
      ammo_max: ammoMax,
      durability_max: durabilityMax,
      image: image.trim() || undefined,
      weapons,
      speed_sectors: speedSectors,
      buffs: buffs.length > 0 ? buffs : undefined,
      ...(mode === 'calculator' ? { calculatorParams: calcParams } : {}),
    };

    onSave(machineData);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header with tech corners */}
      <div className={`relative px-4 py-4 border-b-2 ${factionStyle.border} bg-slate-900/80 backdrop-blur-sm`}>
        {/* Tech corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: factionStyle.corner }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: factionStyle.corner }} />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isOverride ? 'Переопределение техники' : (machine ? 'Редактирование техники' : 'Новая техника')}
            </h2>
            {isOverride && (
              <p className="text-xs text-orange-400 mt-1">
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
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Left column: Basic info */}
          <div className="w-80 border-r border-slate-800/50 p-4 overflow-y-auto space-y-6">
            {/* Section: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                <Target className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Основное</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Название техники *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    placeholder="Введите название"
                  />
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
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Стоимость (очков) *</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">URL изображения техники</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-xs"
                    placeholder="/images/machines/..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Combat Stats */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                <Shield className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Характеристики</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Ранг *</label>
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    min="0"
                    max="7"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Скорострельность</label>
                    <input
                      type="number"
                      value={fireRate}
                      onChange={(e) => setFireRate(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Боезапас</label>
                    <input
                      type="number"
                      value={ammoMax}
                      onChange={(e) => setAmmoMax(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Прочность *</label>
                  <input
                    type="number"
                    value={durabilityMax}
                    onChange={(e) => setDurabilityMax(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    min="1"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Макс прочность. Обновите сектора скорости вручную при изменении.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Stats Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                <Gauge className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Статистика</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Оружие</div>
                  <div className="text-2xl font-bold text-white">{weapons.length}</div>
                  <div className="text-[10px] text-slate-600">макс 4</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Стоимость</div>
                  <div className="text-2xl font-bold text-emerald-400">{cost}</div>
                  <div className="text-[10px] text-slate-600">очков</div>
                </div>
              </div>
            </div>

            {/* Section: Buffs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                <div className="w-1 h-4 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Бафы</h3>
                {buffs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                    {buffs.length}
                  </span>
                )}
              </div>
              <BuffSelector selectedBuffs={buffs} onChange={setBuffs} />
            </div>

            {/* Preview button */}
            <button
              onClick={() => setShowPreview(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 transition-all group"
            >
              <Eye className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-blue-300">Предпросмотр</span>
            </button>
          </div>

          {/* Right column: Weapons and Speed sectors */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Mode tabs */}
            <div className="flex gap-2 border-b border-slate-800">
              <button onClick={() => setMode('calculator')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 ${mode === 'calculator' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent'}`}
                data-testid="machine-calculator-tab">Калькулятор</button>
              <button onClick={() => setMode('manual')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 ${mode === 'manual' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent'}`}
                data-testid="machine-manual-tab">Вручную</button>
              {mode === 'manual' && !machine?.calculatorParams && (
                <span className="ml-auto self-center text-[10px] text-amber-400">ручная стоимость</span>
              )}
            </div>

            {mode === 'calculator' ? (
              <MachineCalculator params={calcParams} onParamsChange={setCalcParams} onApply={handleApplyCost} />
            ) : (
              <>
            {/* Weapons Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Оружие <span className="text-slate-500">({weapons.length}/4)</span>
                  </h3>
                </div>
                <button
                  onClick={handleAddWeapon}
                  disabled={weapons.length >= 4}
                  className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 transition-all disabled:opacity-50 group"
                  title="Добавить оружие"
                >
                  <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                {weapons.map((weapon, index) => (
                  <div key={index} className={`rounded-lg border-2 ${factionStyle.border} bg-slate-800/50 overflow-hidden relative`}>
                    {/* Tech corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t -ml-px -mt-px opacity-60" style={{ borderColor: factionStyle.corner }} />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t -mr-px -mt-px opacity-60" style={{ borderColor: factionStyle.corner }} />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b -ml-px -mb-px opacity-60" style={{ borderColor: factionStyle.corner }} />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b -mr-px -mb-px opacity-60" style={{ borderColor: factionStyle.corner }} />

                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={weapon.name}
                          onChange={(e) => handleUpdateWeapon(index, { name: e.target.value })}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                          placeholder="Название оружия"
                        />
                        <button
                          onClick={() => handleRemoveWeapon(index)}
                          disabled={weapons.length <= 1}
                          className="p-2 rounded-lg hover:bg-red-900/30 transition-all disabled:opacity-50"
                          title="Удалить оружие"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Дальность</label>
                          <input
                            type="text"
                            value={weapon.range}
                            onChange={(e) => handleUpdateWeapon(index, { range: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                            placeholder="D6, D12, D20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Мощность</label>
                          <input
                            type="text"
                            value={weapon.power}
                            onChange={(e) => handleUpdateWeapon(index, { power: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                            placeholder="1D6, 2D12"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Боезапас</label>
                          <input
                            type="number"
                            value={weapon.ammo ?? 20}
                            onChange={(e) => handleUpdateWeapon(index, { ammo: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                            min="0"
                            placeholder="20"
                          />
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Особое (опционально)</label>
                        <input
                          type="text"
                          value={
                            typeof weapon.special === 'string'
                              ? weapon.special || ''
                              : weapon.special
                                ? JSON.stringify(weapon.special)
                                : ''
                          }
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            if (!value) {
                              handleUpdateWeapon(index, { special: undefined });
                            } else {
                              // Try to parse as JSON, otherwise use as string
                              try {
                                const parsed = JSON.parse(value);
                                handleUpdateWeapon(index, { special: parsed });
                              } catch {
                                handleUpdateWeapon(index, { special: value });
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-xs font-mono"
                          placeholder='Текст или {"type": "repair", "amount": 2}'
                        />
                        <p className="text-[10px] text-slate-600 mt-1">
                          Текст или JSON: {`{"type": "repair"|"aoe"|"burst", ...}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speed Sectors Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Сектора скорости <span className="text-slate-500">({speedSectors.length}/6)</span>
                  </h3>
                </div>
                <button
                  onClick={handleAddSpeedSector}
                  disabled={speedSectors.length >= 6}
                  className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 transition-all disabled:opacity-50 group"
                  title="Добавить сектор"
                >
                  <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                {speedSectors.map((sector, index) => (
                  <div key={index} className={`rounded-lg border-2 ${factionStyle.border} bg-slate-800/50 overflow-hidden relative`}>
                    {/* Tech corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t -ml-px -mt-px opacity-60" style={{ borderColor: factionStyle.corner }} />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t -mr-px -mt-px opacity-60" style={{ borderColor: factionStyle.corner }} />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b -ml-px -mb-px opacity-60" style={{ borderColor: factionStyle.corner }} />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b -mr-px -mb-px opacity-60" style={{ borderColor: factionStyle.corner }} />

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Сектор {index + 1}</span>
                        <button
                          onClick={() => handleRemoveSpeedSector(index)}
                          disabled={speedSectors.length <= 1}
                          className="p-2 rounded-lg hover:bg-red-900/30 transition-all disabled:opacity-50"
                          title="Удалить сектор"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Мин. прочность</label>
                          <input
                            type="number"
                            value={sector.min_durability}
                            onChange={(e) => handleUpdateSpeedSector(index, { min_durability: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Макс. прочность</label>
                          <input
                            type="number"
                            value={sector.max_durability}
                            onChange={(e) => handleUpdateSpeedSector(index, { max_durability: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Скорость</label>
                          <input
                            type="number"
                            value={sector.speed}
                            onChange={(e) => handleUpdateSpeedSector(index, { speed: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className={`mt-2 px-3 py-1.5 rounded-lg text-center ${factionStyle.badge} font-mono font-bold`}>
                        {sector.min_durability}-{sector.max_durability} → {sector.speed} шаг(а)
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Макс. скорость: {Math.max(...speedSectors.map(s => s.speed))} шаг(а)</span>
                  <span>Диапазон: 1-{durabilityMax}</span>
                </div>
                {speedSectors.some(s => s.max_durability > durabilityMax) && (
                  <p className="text-[10px] text-amber-400 mt-2">
                    ⚠️ Внимание: Некоторые сектора превышают максимальную прочность ({durabilityMax})
                  </p>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 z-10">
              <h2 className="text-lg font-semibold text-white">Предпросмотр техники</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <MachinePreview
                name={name || 'Новая техника'}
                shortName={shortName}
                cost={cost}
                rank={rank}
                fireRate={fireRate}
                ammoMax={ammoMax}
                durabilityMax={durabilityMax}
                image={image}
                weapons={weapons}
                speedSectors={speedSectors}
                faction={factionId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
