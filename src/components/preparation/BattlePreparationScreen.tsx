import { useState } from 'react';
import { Sword, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Army } from '@/lib/types';
import { PrepArmyList } from './PrepArmyList';
import InitiativeModal from '../modals/InitiativeModal';
import { BASE_PATH } from '@/lib/constants';
import { getFactionColors } from '@/lib/faction-colors';

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
  onBackToBuilder: _onBackToBuilder,
}: BattlePreparationScreenProps) {
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);

  // Получаем фракционные цвета
  const colors = getFactionColors(army.faction || 'polaris');

  // Обработка начала боя после инициативы
  const handleStartBattle = () => {
    setArmy({
      ...army,
      isInBattle: true,
      currentStep: 'battle',
      lastBattleDate: new Date().toISOString()
    });
    onStartBattle();
  };

  // Количество боеспособных юнитов
  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as any).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  const hasUnits = army.units.length > 0;

  return (
    <div className="relative min-h-screen pb-36">
      {/* Фоновое изображение */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BASE_PATH}/images/hero-art.jpg)` }}
      />

      {/* Затемнение для читаемости */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      {/* Контент поверх фона */}
      <div className="relative z-10" data-testid="battle-preparation-screen">
        {/* Основной контент */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
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
          <PrepArmyList army={army} />
        </div>

        {/* Плавающая кнопка "Начать бой" - в стиле приложения */}
        <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4">
          <div className="relative group" style={{ maxWidth: '400px', width: '100%' }}>
            {/* Scroll indicator at top - gradient fade showing content continues */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full" />
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent rounded-full" />
              <div className="w-4 h-0.5 bg-slate-700 rounded-full animate-pulse" />
            </div>

            {/* Внешнее свечение */}
            <div
              className={cn(
                "absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm",
                colors.glow
              )}
            />

            {/* Основная кнопка - более прозрачная */}
            <button
              onClick={() => {
                if (hasUnits) {
                  setShowInitiativeModal(true);
                }
              }}
              className={cn(
                "relative w-full pointer-events-auto",
                "py-4 px-6 rounded-lg",
                "flex items-center justify-center gap-3",
                "font-mono text-base md:text-lg font-bold uppercase tracking-wider",
                "transition-all duration-200",
                "border-2",
                // Более прозрачный фон
                "bg-slate-900/80 backdrop-blur-md",
                colors.border,
                colors.text,
                // Hover эффекты - только если есть юниты
                hasUnits && "hover:scale-[1.02] hover:bg-slate-900/90",
                hasUnits && "active:scale-95",
                // Тень
                "shadow-lg hover:shadow-xl",
                hasUnits && colors.glow.replace('shadow-', 'hover:shadow-'),
                // Disabled state - визуально отключена
                !hasUnits && "opacity-40 cursor-not-allowed"
              )}
              data-testid="start-battle-button"
            >
              {/* Top fade indicator - subtle gradient showing content behind */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none rounded-t-lg" />

              {/* Animated background effect */}
              {hasUnits && (
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity",
                  colors.bg.replace('/10', '/20')
                )} />
              )}

              {/* Scanline effect */}
              {hasUnits && (
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-full w-full animate-pulse"
                    style={{ animationDuration: '2s' }}
                  />
                </div>
              )}

              {/* Иконка меча */}
              <Sword className="w-6 h-6 relative z-10" />

              {/* Текст */}
              <span className="relative z-10">Начать бой</span>

              {/* Иконка стрелки вверх (подсказка) */}
              {hasUnits && (
                <ChevronUp className="w-5 h-5 relative z-10 animate-bounce" />
              )}

              {/* Tech corners - технические уголки в стиле приложения */}
              <div className={cn(
                "absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2",
                colors.text.replace('text-', 'border-'),
                "opacity-50"
              )} />
              <div className={cn(
                "absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2",
                colors.text.replace('text-', 'border-'),
                "opacity-50"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2",
                colors.text.replace('text-', 'border-'),
                "opacity-50"
              )} />
              <div className={cn(
                "absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2",
                colors.text.replace('text-', 'border-'),
                "opacity-50"
              )} />
            </button>

            {/* Подсказка при наведении */}
            {hasUnits && (
              <div className={cn(
                "absolute -top-12 left-1/2 -translate-x-1/2",
                "whitespace-nowrap px-3 py-1.5 rounded",
                "bg-slate-900/95 text-slate-300 text-xs font-mono font-medium",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "border border-slate-700/50 shadow-lg",
                "pointer-events-none"
              )}>
                Бросить кубик инициативы
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-slate-700/50" />
              </div>
            )}
          </div>
        </div>

        {/* Модальное окно инициативы */}
        <InitiativeModal
          isOpen={showInitiativeModal}
          onClose={() => setShowInitiativeModal(false)}
          onConfirm={handleStartBattle}
          factionId={army.faction || 'polaris'}
          activeUnitsCount={activeUnitsCount}
          context="preparation"
        />
      </div>
    </div>
  );
}
