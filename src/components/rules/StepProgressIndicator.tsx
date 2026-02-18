'use client';

import React from 'react';
import { Shield, Coins, Book, Users, Sword, Check, LucideIcon } from 'lucide-react';
import type { FactionID, RulesVersionID } from '@/lib/types';
import { getFactionColors } from '@/lib/faction-colors';

interface Step {
  id: number;
  label: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  { id: 1, label: 'Фракция', description: 'Выберите сторону конфликта', icon: Shield },
  { id: 2, label: 'Бюджет', description: 'Установите лимит очков армии', icon: Coins },
  { id: 3, label: 'Правила', description: 'Выберите версию правил', icon: Book },
  { id: 4, label: 'Армия', description: 'Соберите свою армию', icon: Users },
  { id: 5, label: 'Расстановка', description: 'Подготовьте войска к бою', icon: Sword },
];

interface StepProgressIndicatorProps {
  currentStep: 'faction' | 'budget' | 'rules' | 'units' | 'preparation' | 'complete';
  selectedFaction?: FactionID;
  selectedBudget?: number;
  selectedRules?: RulesVersionID;
}

/**
 * StepProgressIndicator - Visual progress indicator for 5-step army setup flow
 *
 * Accessibility:
 * - aria-current="step" for active step
 * - Keyboard navigation support
 * - Screen reader announcements
 *
 * Mobile:
 * - Icons only on mobile
 * - Full labels on desktop
 */
export function StepProgressIndicator({
  currentStep,
  selectedFaction,
  selectedBudget: _selectedBudget,
  selectedRules: _selectedRules,
}: StepProgressIndicatorProps) {
  const getStepIndex = (): number => {
    switch (currentStep) {
      case 'faction': return 0;
      case 'budget': return 1;
      case 'rules': return 2;
      case 'units': return 3;
      case 'preparation':
      case 'complete': return 4;
      default: return 0;
    }
  };

  const activeIndex = getStepIndex();
  const activeStep = steps[activeIndex];

  // Get faction color for active step glow
  const factionColors = selectedFaction ? getFactionColors(selectedFaction) : null;
  const activeColor = factionColors?.primary || '#64748b';

  return (
    <div className="w-full mb-8">
      {/* Progress bar container */}
      <div className="flex items-center justify-center gap-1.5 md:gap-4">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center gap-2">
                <button
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Шаг ${step.id}: ${step.label}${isActive ? `, текущий шаг` : isCompleted ? `, завершен` : ''}`}
                  className={`
                    relative flex items-center justify-center
                    rounded-full font-semibold transition-all duration-300
                    ${isActive
                      ? 'w-11 h-11 md:w-14 md:h-14 text-white scale-110'
                      : isCompleted
                        ? 'w-9 h-9 md:w-12 md:h-12 text-green-400 bg-green-500/20 border-2 border-green-500'
                        : 'w-9 h-9 md:w-12 md:h-12 text-slate-500 bg-slate-800/50 border-2 border-slate-700 opacity-60'
                    }
                  `}
                  style={isActive ? {
                    backgroundColor: activeColor,
                    boxShadow: `0 0 20px ${activeColor}40`,
                  } : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <StepIcon className="w-5 h-5 md:w-6 md:h-6" />
                  )}

                  {/* Pulse animation for active step */}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: activeColor }}
                    />
                  )}
                </button>

                {/* Step label - hidden on mobile */}
                <span
                  className={`
                    hidden md:block text-xs md:text-sm font-medium transition-colors duration-300
                    ${isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line - not after last step */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-0.5 w-6 md:w-16 rounded-full transition-all duration-300
                    ${index < activeIndex ? 'bg-green-500' : 'bg-slate-700'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Hint text for active step */}
      {activeStep && (
        <p className="text-center text-sm text-slate-400 mt-4 animate-fade-in">
          {activeStep.description}
        </p>
      )}
    </div>
  );
}
