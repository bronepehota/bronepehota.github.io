/**
 * ModifiersEditor - main view for managing buffs and debuffs.
 * Two tabs (БАФЫ / ДЕБАФЫ) with CRUD for custom modifiers,
 * inline create/edit form, and JSON export/import.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  ShieldOff,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { getStandardBuffs, getStandardDebuffs } from '@/lib/modifier-utils';
import {
  getCustomModifiers,
  addCustomBuff,
  removeCustomBuff,
  addCustomDebuff,
  removeCustomDebuff,
} from '@/lib/editor/modifier-storage';
import type {
  BuffDefinition,
  DebuffTemplate,
  ModifierTarget,
  ModifierPhase,
  ModifierApplyTarget,
  ModifierDuration,
} from '@/lib/modifier-types';
import { DURATION_OPTIONS, APPLY_TARGET_OPTIONS } from '@/lib/modifier-types';

import { ModifierIcon, MODIFIER_ICON_OPTIONS } from './ModifierIcons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ModifiersEditorProps {
  onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Tab = 'buffs' | 'debuffs';

const TARGET_OPTIONS: { value: ModifierTarget; label: string }[] = [
  { value: 'range_bonus', label: 'Дальность (+/-)' },
  { value: 'range_multiply', label: 'Дальность (xN)' },
  { value: 'power_bonus', label: 'Мощность (+/-)' },
  { value: 'melee_bonus', label: 'ББ (+/-)' },
  { value: 'speed_multiply', label: 'Скорость (xN)' },
  { value: 'armor_bonus', label: 'Броня (+/-)' },
  { value: 'distance_penalty', label: 'Дистанция (+)' },
  { value: 'custom', label: 'Кастомный' },
];

const PHASE_OPTIONS: { value: ModifierPhase; label: string }[] = [
  { value: 'always', label: 'Всегда' },
  { value: 'shot', label: 'Стрельба' },
  { value: 'melee', label: 'Ближний бой' },
  { value: 'grenade', label: 'Граната' },
];

// ---------------------------------------------------------------------------
// Icon helpers (use shared ModifierIcon)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

function targetLabel(target: ModifierTarget, value: number): string {
  switch (target) {
    case 'range_bonus': return `дальность ${value >= 0 ? '+' : ''}${value}`;
    case 'range_multiply': return `дальность x${value}`;
    case 'power_bonus': return `мощность ${value >= 0 ? '+' : ''}${value}`;
    case 'melee_bonus': return `ББ ${value >= 0 ? '+' : ''}${value}`;
    case 'speed_multiply': return `скорость x${value}`;
    case 'armor_bonus': return `броня ${value >= 0 ? '+' : ''}${value}`;
    case 'distance_penalty': return `дистанция +${value}`;
    case 'custom': return 'особый эффект';
  }
}

function phaseLabel(phase: ModifierPhase): string {
  switch (phase) {
    case 'always': return 'всегда';
    case 'shot': return 'стрельба';
    case 'melee': return 'ББ';
    case 'grenade': return 'граната';
  }
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  description: string;
  target: ModifierTarget;
  value: number;
  phase: ModifierPhase;
  applyTo: ModifierApplyTarget[];
  oneTimeUse: boolean;
  isTemporary: boolean;      // If true, requires duration (for battle use)
  duration?: ModifierDuration; // 1, 2, or 3 turns (required if isTemporary)
  icon: string;
}

const EMPTY_BUFF_FORM: FormData = {
  name: '',
  description: '',
  target: 'range_bonus',
  value: 1,
  phase: 'always',
  applyTo: ['soldier'],
  oneTimeUse: false,
  isTemporary: false,
  icon: 'Sparkles',
};

const EMPTY_DEBUFF_FORM: FormData = {
  name: '',
  description: '',
  target: 'speed_multiply',
  value: 0.5,
  phase: 'always',
  applyTo: ['soldier', 'machine'],
  oneTimeUse: false,
  isTemporary: true,   // Debuffs are always temporary
  duration: 1,         // Default duration for debuffs
  icon: 'ShieldOff',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ModifiersEditor({ onRefresh }: ModifiersEditorProps) {
  const [tab, setTab] = useState<Tab>('buffs');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_BUFF_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Counter to force re-read from localStorage after mutations
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load data from localStorage (reactive via refreshCounter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const custom = useMemo(() => getCustomModifiers(), [refreshCounter]);
  const standardBuffs = useMemo(() => getStandardBuffs(), []);
  const standardDebuffs = useMemo(() => getStandardDebuffs(), []);

  // Merged lists
  const allBuffs = useMemo(
    () => [...standardBuffs, ...custom.buffs],
    [standardBuffs, custom.buffs],
  );
  const allDebuffs = useMemo(
    () => [...standardDebuffs, ...custom.debuffs],
    [standardDebuffs, custom.debuffs],
  );

  const isCustom = useCallback(
    (id: string) =>
      custom.buffs.some(b => b.id === id) || custom.debuffs.some(d => d.id === id),
    [custom.buffs, custom.debuffs],
  );

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const refreshData = () => {
    setRefreshCounter(c => c + 1);
    onRefresh();
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm(tab === 'buffs' ? { ...EMPTY_BUFF_FORM } : { ...EMPTY_DEBUFF_FORM });
    setFormErrors({});
  };

  const handleStartEdit = (item: BuffDefinition | DebuffTemplate) => {
    setEditingId(item.id);
    setIsCreating(false);
    setForm({
      name: item.name,
      description: item.description,
      target: item.target,
      value: item.value,
      phase: item.phase,
      applyTo: ('applyTo' in item ? item.applyTo : []) as ModifierApplyTarget[],
      oneTimeUse: 'oneTimeUse' in item ? !!item.oneTimeUse : false,
      isTemporary: 'duration' in item,  // Has duration = temporary effect
      duration: 'duration' in item ? item.duration : undefined,
      icon: item.icon || (tab === 'buffs' ? 'Sparkles' : 'ShieldOff'),
    });
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormErrors({});
  };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Введите название';
    // Validation: temporary effects must have duration
    if (form.isTemporary && !form.duration) {
      errors.duration = 'Укажите длительность';
    }
    if (formErrors) setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (tab === 'buffs') {
      const buff: BuffDefinition = {
        id: isCreating ? `custom_buff_${Date.now()}` : (editingId || `custom_buff_${Date.now()}`),
        name: form.name.trim(),
        description: form.description.trim(),
        applyTo: form.applyTo,
        target: form.target,
        value: form.value,
        phase: form.phase,
        icon: form.icon || undefined,
        oneTimeUse: form.oneTimeUse || undefined,
        duration: form.isTemporary ? form.duration : undefined,
        isCustom: true,
      };
      addCustomBuff(buff);
    } else {
      const debuff: DebuffTemplate = {
        id: isCreating ? `custom_debuff_${Date.now()}` : (editingId || `custom_debuff_${Date.now()}`),
        name: form.name.trim(),
        description: form.description.trim(),
        applyTo: form.applyTo,
        target: form.target,
        value: form.value,
        phase: form.phase,
        duration: form.duration || 1,
        icon: form.icon || undefined,
        isCustom: true,
      };
      addCustomDebuff(debuff);
    }

    handleCancelEdit();
    refreshData();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить этот модификатор?')) return;
    if (tab === 'buffs') {
      removeCustomBuff(id);
    } else {
      removeCustomDebuff(id);
    }
    if (editingId === id) handleCancelEdit();
    refreshData();
  };

  // -----------------------------------------------------------------------
  // Form change helpers
  // -----------------------------------------------------------------------

  const updateForm = (patch: Partial<FormData>) => setForm(prev => ({ ...prev, ...patch }));

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const inputCls =
    'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-100 placeholder-slate-500';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1';
  const selectCls =
    'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-100 appearance-none';

  const items = tab === 'buffs' ? allBuffs : allDebuffs;
  const isBuffTab = tab === 'buffs';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm shrink-0">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
          Модификаторы
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30
                       text-emerald-400 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Создать
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50 shrink-0">
        <button
          onClick={() => { setTab('buffs'); handleCancelEdit(); }}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all relative ${
            tab === 'buffs'
              ? 'text-white border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>БАФЫ</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                tab === 'buffs'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 text-slate-500'
              }`}
            >
              {allBuffs.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => { setTab('debuffs'); handleCancelEdit(); }}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all relative ${
            tab === 'debuffs'
              ? 'text-white border-b-2 border-red-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ShieldOff className="w-4 h-4" />
            <span>ДЕБАФЫ</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                tab === 'debuffs'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-700 text-slate-500'
              }`}
            >
              {allDebuffs.length}
            </span>
          </div>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Create / Edit form */}
        {(isCreating || editingId) && (
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {isCreating
                ? `Новый ${isBuffTab ? 'баф' : 'дебаф'}`
                : `Редактирование: ${form.name}`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Название</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Название модификатора"
                  value={form.name}
                  onChange={e => updateForm({ name: e.target.value })}
                />
                {formErrors.name && (
                  <div className="text-xs text-red-400 mt-1">{formErrors.name}</div>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Описание</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Краткое описание эффекта"
                  value={form.description}
                  onChange={e => updateForm({ description: e.target.value })}
                />
              </div>

              {/* Target */}
              <div>
                <label className={labelCls}>Тип эффекта</label>
                <select
                  className={selectCls}
                  value={form.target}
                  onChange={e => updateForm({ target: e.target.value as ModifierTarget })}
                >
                  {TARGET_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-600 mt-1">Какая характеристика изменяется</div>
              </div>

              {/* Value */}
              <div>
                <label className={labelCls}>Значение</label>
                <input
                  type="number"
                  step="any"
                  className={inputCls}
                  value={form.value}
                  onChange={e => updateForm({ value: parseFloat(e.target.value) || 0 })}
                />
                <div className="text-[10px] text-slate-600 mt-1">Плюс/минус для аддитивных, множитель для xN</div>
              </div>

              {/* Phase */}
              <div>
                <label className={labelCls}>Фаза</label>
                <select
                  className={selectCls}
                  value={form.phase}
                  onChange={e => updateForm({ phase: e.target.value as ModifierPhase })}
                >
                  {PHASE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-600 mt-1">В какой фазе боя действует эффект</div>
              </div>

              {/* Apply To targets */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Применяется к</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {APPLY_TARGET_OPTIONS.map(opt => {
                    const selected = form.applyTo.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateForm({
                            applyTo: selected
                              ? form.applyTo.filter(v => v !== opt.value)
                              : [...form.applyTo, opt.value],
                          });
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-emerald-600/20 border-emerald-600/40 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">К каким типам юнитов можно применить модификатор</div>
              </div>

              {/* Icon */}
              <div>
                <label className={labelCls}>Иконка</label>
                <select
                  className={selectCls}
                  value={form.icon?.startsWith('http') ? '__url__' : form.icon || ''}
                  onChange={e => {
                    if (e.target.value === '__url__') {
                      updateForm({ icon: '' });
                    } else {
                      updateForm({ icon: e.target.value });
                    }
                  }}
                >
                  <option value="">По умолчанию</option>
                  {MODIFIER_ICON_OPTIONS.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="__url__">URL изображения...</option>
                </select>
                {form.icon?.startsWith('http') && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="https://example.com/icon.png"
                      value={form.icon}
                      onChange={e => updateForm({ icon: e.target.value })}
                    />
                    <div className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-slate-700">
                      <ModifierIcon name={form.icon} size={20} />
                    </div>
                  </div>
                )}
                {form.icon && !form.icon.startsWith('http') && (
                  <div className="mt-2 flex items-center justify-center w-8 h-8 rounded-md bg-slate-700">
                    <ModifierIcon name={form.icon} size={20} />
                  </div>
                )}
              </div>

              {/* One-time use (buffs only) */}
              {isBuffTab && (
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.oneTimeUse}
                      onChange={e => updateForm({ oneTimeUse: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    Одноразовый
                  </label>
                  <div className="text-[10px] text-slate-600">Истощается после первого использования за бой</div>
                </div>
              )}

              {/* Temporary effect (for battle use) */}
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isTemporary}
                    onChange={e => {
                      const isTemp = e.target.checked;
                      updateForm({
                        isTemporary: isTemp,
                        duration: isTemp ? (form.duration || 1) : undefined,
                      });
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  Временный эффект (для применения в бою)
                </label>
                <div className="text-[10px] text-slate-600">Действует N ходов, затем автоматически снимается</div>

                {/* Duration dropdown (shown when isTemporary is true) */}
                {form.isTemporary && (
                  <select
                    value={form.duration || 1}
                    onChange={e => updateForm({ duration: Number(e.target.value) as ModifierDuration })}
                    className="ml-6 px-2 py-1 rounded text-sm bg-slate-800 border border-slate-600 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                           bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                           bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Сохранить
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="divide-y divide-slate-800/60">
          {items.length === 0 && !isCreating && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Нет модификаторов. Нажмите &quot;Создать&quot; чтобы добавить.
            </div>
          )}

          {items.map(item => {
            const custom = isCustom(item.id);
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                  isEditing
                    ? 'bg-slate-800/90 border-l-2 border-emerald-500'
                    : custom
                      ? 'bg-slate-900/60 hover:bg-slate-800/50'
                      : 'bg-slate-950/40'
                }`}
              >
                {/* Icon */}
                <div
                  className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${
                    isBuffTab
                      ? 'bg-emerald-950/40 text-emerald-500'
                      : 'bg-red-950/40 text-red-500'
                  } ${!custom ? 'opacity-50' : ''}`}
                >
                  <ModifierIcon
                    name={item.icon}
                    size={16}
                    className="w-4 h-4"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-100">{item.name}</span>
                    {custom && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-600/30 text-amber-400 font-medium uppercase tracking-wider">
                        МОЙ
                      </span>
                    )}
                    {'applyTo' in item && item.applyTo.map(t => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-800/80 border border-slate-600/30 text-slate-400"
                      >
                        {APPLY_TARGET_OPTIONS.find(o => o.value === t)?.label || t}
                      </span>
                    ))}
                  </div>
                  {item.description && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-mono text-slate-500">
                      {targetLabel(item.target, item.value)}
                    </span>
                    <span className="text-slate-700 text-[11px]">/</span>
                    <span className="text-[11px] text-slate-500">
                      {phaseLabel(item.phase)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {custom ? (
                    <>
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-md hover:bg-slate-700 transition-colors"
                        title="Редактировать"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-md hover:bg-red-950/50 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled
                        className="p-1.5 rounded-md opacity-30 cursor-not-allowed"
                        title="Стандартный модификатор — только чтение"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        disabled
                        className="p-1.5 rounded-md opacity-30 cursor-not-allowed"
                        title="Стандартный модификатор — только чтение"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
