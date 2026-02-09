import { useState } from 'react';
import { ArrowLeft, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Army, FactionID } from '@/lib/types';
import { CompactArmyCard } from './CompactArmyCard';
import InitiativeModal from './InitiativeModal';

interface BattlePreparationScreenProps {
  army: Army;
  setArmy: (army: Army) => void;
  onStartBattle: () => void;
  onBackToBuilder: () => void;
}

export function BattlePreparationScreen({
  army,
  setArmy,
  onStartBattle,
  onBackToBuilder,
}: BattlePreparationScreenProps) {
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);

  // Фракционные стили
  const factionStyles: Record<FactionID, any> = {
    polaris: {
      accent: 'text-red-400',
      bg: 'bg-red-900/10',
      primary: 'text-red-100',
      accentBorder: 'border-red-500/50',
      accentGlow: 'shadow-red-500/20',
    },
    protectorate: {
      accent: 'text-cyan-400',
      bg: 'bg-cyan-900/10',
      primary: 'text-cyan-100',
      accentBorder: 'border-cyan-500/50',
      accentGlow: 'shadow-cyan-500/20',
    },
    mercenaries: {
      accent: 'text-yellow-400',
      bg: 'bg-yellow-900/10',
      primary: 'text-yellow-100',
      accentBorder: 'border-yellow-500/50',
      accentGlow: 'shadow-yellow-500/20',
    },
  };

  const styles = factionStyles[army.faction] || factionStyles.polaris;

  // Обработка начала боя после инициативы
  const handleStartBattle = () => {
    setArmy({ ...army, isInBattle: true, currentStep: 'battle' });
    onStartBattle();
  };

  // Количество боеспособных юнитов
  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as any).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  return (
    <div className="relative min-h-screen">
      {/* Фоновое изображение */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/hero-art.jpg)' }}
      />

      {/* Затемнение для читаемости */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      {/* Контент поверх фона */}
      <div className="relative z-10" data-testid="battle-preparation-screen">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={onBackToBuilder}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 active:scale-95 touch-manipulation"
              data-testid="back-to-builder-button"
              aria-label="Вернуться к сбору армии"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-mono font-black uppercase tracking-wider text-white">
                Подготовка к бою
              </h1>
            </div>

            {/* Фракционный индикатор */}
            <div className={cn('px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border', styles.bg, styles.accentBorder, styles.accent)}>
              {army.faction === 'polaris' && 'Полярис'}
              {army.faction === 'protectorate' && 'Протекторат'}
              {army.faction === 'mercenaries' && 'Наёмники'}
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-40">
          {/* Иммерсивный текст */}
          <div className="text-center space-y-3 px-2">
            <h2 className="text-2xl md:text-3xl font-mono font-black uppercase tracking-wider text-white">
              Готовьте войска!
            </h2>

            <div className="max-w-2xl mx-auto space-y-2">
              <p className="text-base md:text-lg text-slate-200 leading-relaxed">
                Соберите миниатюры и расставьте их на поле.
              </p>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Бросьте кубик для определения первого хода.
              </p>
            </div>

            {/* Декоративная линия */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent max-w-xs" />
              <div className="w-2 h-2 border border-slate-500 rotate-45" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent max-w-xs" />
            </div>
          </div>

          {/* Список армии */}
          <div className="space-y-4">
            {/* Заголовок списка */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
                Состав армии
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {army.units.length} {army.units.length === 1 ? 'юнит' : army.units.length > 1 && army.units.length < 5 ? 'юнита' : 'юнитов'} • {army.totalCost} {army.totalCost === 1 ? 'очко' : army.totalCost > 1 && army.totalCost < 5 ? 'очка' : 'очков'}
              </span>
            </div>

            {/* Список - переиспользуем CompactArmyCard */}
            <div className="space-y-2" data-testid="army-list-prep">
              {army.units.map((unit) => (
                <CompactArmyCard
                  key={unit.instanceId}
                  unit={unit}
                  onRemove={() => {}}
                  onClick={undefined}
                  factionId={army.faction}
                  dataTestId={`prep-unit-${unit.instanceId}`}
                  readonly
                />
              ))}
            </div>

            {/* Пустое состояние */}
            {army.units.length === 0 && (
              <div className="text-center py-12 px-4">
                <p className="text-slate-400">Армия пуста. Вернитесь к сбору армии.</p>
              </div>
            )}
          </div>
        </div>

        {/* Фиксированная кнопка "Начать бой" */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 p-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setShowInitiativeModal(true)}
              disabled={army.units.length === 0}
              className={cn(
                "w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3",
                "font-mono text-lg font-bold uppercase tracking-wider",
                "transition-all duration-200 min-h-[60px]",
                "border-2 relative overflow-hidden group",
                styles.accentBorder,
                styles.bg,
                styles.primary,
                army.units.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02] active:scale-95",
                "shadow-2xl hover:shadow-3xl",
                styles.accentGlow
              )}
              data-testid="start-battle-button"
            >
              {/* Иконка меча */}
              <Sword className="w-6 h-6 relative z-10" />

              {/* Текст */}
              <span className="relative z-10">Начать бой</span>

              {/* Технические уголки */}
              <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", styles.accent.replace('text-', 'border-'))} />
              <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", styles.accent.replace('text-', 'border-'))} />
              <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", styles.accent.replace('text-', 'border-'))} />
              <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", styles.accent.replace('text-', 'border-'))} />
            </button>
          </div>
        </div>

        {/* Модальное окно инициативы */}
        <InitiativeModal
          isOpen={showInitiativeModal}
          onClose={() => setShowInitiativeModal(false)}
          onConfirm={handleStartBattle}
          factionId={army.faction}
          activeUnitsCount={activeUnitsCount}
          context="preparation"
        />
      </div>
    </div>
  );
}
