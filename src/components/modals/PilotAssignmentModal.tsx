'use client';

import { useEffect, useRef, useState } from 'react';
import { GitHubPagesImage as Image } from '../GitHubPagesImage';
import { ArmyUnit, Machine, PilotInfo, Squad, Soldier } from '@/lib/types';
import { Shield, UserX, X, ArrowLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PilotCandidate {
  unit: ArmyUnit;
  soldierIndex: number;
  soldierArmor: number;
  soldierRank: number;
  unitNumber: number;
  alreadyPilot: boolean; // Already piloting this machine
}

interface SquadCandidates {
  squad: ArmyUnit;
  candidates: PilotCandidate[];
  eligibleCount: number;
}

type StepState = 'squads' | 'soldiers';

interface PilotAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: ArmyUnit & { data: Machine };
  allUnits: ArmyUnit[];
  onAssignPilot: (pilotInfo: PilotInfo) => void;
  onRemovePilot: () => void;
}

export function PilotAssignmentModal({
  isOpen,
  onClose,
  machine,
  allUnits,
  onAssignPilot,
  onRemovePilot,
}: PilotAssignmentModalProps) {
  const [selectedPilot, setSelectedPilot] = useState<PilotCandidate | null>(null);
  const [step, setStep] = useState<StepState>('squads');
  const [selectedSquad, setSelectedSquad] = useState<ArmyUnit | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPilot(null);
      setSelectedSquad(null);
      setStep('squads');
      setCurrentY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Check if unit has the current pilot for this machine
  const unitHasCurrentPilot = (unit: ArmyUnit): boolean => {
    return machine.pilotInfo?.squadInstanceId === unit.instanceId;
  };

  // Check if specific soldier is the current pilot
  const soldierIsCurrentPilot = (unit: ArmyUnit, soldierIndex: number): boolean => {
    return machine.pilotInfo?.squadInstanceId === unit.instanceId &&
           machine.pilotInfo?.soldierIndex === soldierIndex;
  };

  // Get squads with eligible pilots (grouped by squad)
  const getSquadsWithEligiblePilots = (): SquadCandidates[] => {
    const machineRank = machine.data.rank;
    const squadMap = new Map<string, SquadCandidates>();

    allUnits.forEach((unit) => {
      if (unit.type !== 'squad') return;
      const squad = unit.data as Squad;

      const eligible = squad.soldiers
        .map((soldier, idx) => ({ soldier, idx }))
        .filter(({ soldier, idx }) => {
          const isCurrentPilot = soldierIsCurrentPilot(unit, idx);
          const isEligible = soldier.rank >= machineRank &&
                           !unit.deadSoldiers?.includes(idx) &&
                           !soldier.isPilot;
          return isEligible || isCurrentPilot;
        });

      if (eligible.length > 0 || unitHasCurrentPilot(unit)) {
        // Find unit number
        const squadNumber = allUnits
          .filter((u) => u.type === 'squad')
          .findIndex((u) => u.instanceId === unit.instanceId);

        const candidates: PilotCandidate[] = eligible.map(e => ({
          unit,
          soldierIndex: e.idx,
          soldierArmor: e.soldier.armor,
          soldierRank: e.soldier.rank,
          unitNumber: squadNumber + 1,
          alreadyPilot: soldierIsCurrentPilot(unit, e.idx),
        }));

        squadMap.set(unit.instanceId, {
          squad: unit,
          candidates,
          eligibleCount: candidates.filter(c => !c.alreadyPilot).length,
        });
      }
    });

    return Array.from(squadMap.values());
  };

  // Get soldier image URL
  const getSoldierImage = (soldier: Soldier): string => {
    if (soldier.image) return soldier.image;
    return '/images/soldiers/empty.png';
  };

  const squadCandidates = getSquadsWithEligiblePilots();
  const selectedSquadCandidates = selectedSquad
    ? squadCandidates.find(sc => sc.squad.instanceId === selectedSquad.instanceId)
    : null;

  // Handle touch events for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only start drag if touching near the top (handle area)
    if (touch.clientY < 100) {
      setTouchStart(touch.clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    // Close threshold: 100px
    if (currentY > 100) {
      onClose();
    } else {
      setCurrentY(0);
    }
    setIsDragging(false);
  };

  const handleAssignPilot = () => {
    if (selectedPilot) {
      const pilotInfo: PilotInfo = {
        squadInstanceId: selectedPilot.unit.instanceId,
        soldierIndex: selectedPilot.soldierIndex,
        pilotArmor: selectedPilot.soldierArmor,
        alive: true,
      };
      onAssignPilot(pilotInfo);
      onClose();
    }
  };

  const handleRemovePilot = () => {
    onRemovePilot();
    onClose();
  };

  if (!isOpen) return null;

  const hasPilot = !!machine.pilotInfo;
  const dragStyle = isDragging
    ? { transform: `translateY(${currentY}px)`, transition: 'none' }
    : { transform: 'translateY(0)', transition: 'transform 0.3s ease-out' };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col"
        style={dragStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'soldiers' && (
              <button
                onClick={() => {
                  setStep('squads');
                  setSelectedSquad(null);
                  setSelectedPilot(null);
                }}
                className="p-1.5 -ml-1.5 hover:bg-slate-800 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center mr-1"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">
                {step === 'squads' ? 'Выберите отряд' : 'Выберите бойца'}
              </h2>
              <p className="text-xs text-slate-400">{machine.data.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-2 border-b border-slate-700 flex-shrink-0">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
            step === 'squads' ? "bg-blue-900/30 text-blue-400" : "bg-slate-800 text-slate-500"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
              step === 'squads' ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-500"
            )}>
              1
            </div>
            Отряды
          </div>
          <div className={cn(
            "w-8 h-0.5",
            step === 'soldiers' ? "bg-blue-600" : "bg-slate-700"
          )} />
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
            step === 'soldiers' ? "bg-blue-900/30 text-blue-400" : "bg-slate-800 text-slate-500"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
              step === 'soldiers' ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-500"
            )}>
              2
            </div>
            Бойцы
          </div>
        </div>

        {/* Current Pilot Info (if assigned) */}
        {hasPilot && (
          <div className="px-4 py-3 border-b border-slate-700 bg-green-900/10 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-green-900/30 border border-green-700/50 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-green-400">Пилот назначен</div>
                  <div className="text-xs text-slate-400 truncate">
                    Отряд #{allUnits.find((u) => u.instanceId === machine.pilotInfo?.squadInstanceId)?.instanceNumber} - Боец #{(machine.pilotInfo?.soldierIndex || 0) + 1}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {machine.pilotInfo?.alive ? (
                  <span className="text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded">ЖИВ</span>
                ) : (
                  <span className="text-xs font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded">ПОГИБ</span>
                )}
                <button
                  onClick={handleRemovePilot}
                  className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Убрать пилота"
                >
                  <UserX className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Rank Requirement */}
          <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Требование ранга: {machine.data.rank}+</span>
            </div>
          </div>

          {/* Step 1: Squad List */}
          {step === 'squads' && (
            <>
              {squadCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Нет доступных пилотов</p>
                  <p className="text-slate-600 text-xs mt-1">
                    Для управления этой машиной нужен боец с рангом {machine.data.rank} или выше
                  </p>
                </div>
              ) : (
                <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                  {squadCandidates.map((sc) => {
                    const hasCurrentPilot = unitHasCurrentPilot(sc.squad);
                    const squad = sc.squad.data as Squad;

                    return (
                      <button
                        key={sc.squad.instanceId}
                        onClick={() => {
                          setSelectedSquad(sc.squad);
                          setStep('soldiers');
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all active:scale-95",
                          hasCurrentPilot
                            ? "bg-green-900/20 border-green-700/50"
                            : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                            hasCurrentPilot ? "bg-green-900/30" : "bg-slate-700"
                          )}>
                            <Users className={cn(
                              "w-6 h-6",
                              hasCurrentPilot ? "text-green-400" : "text-slate-400"
                            )} />
                          </div>

                          {/* Squad Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm truncate">
                                {squad.name} #{sc.squad.instanceNumber}
                              </span>
                              {hasCurrentPilot && (
                                <span className="text-xs font-bold text-green-400 shrink-0">ТЕКУЩИЙ</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={cn(
                                "font-bold",
                                hasCurrentPilot ? "text-green-400" : "text-blue-400"
                              )}>
                                {sc.eligibleCount} пилотов
                              </span>
                              <span className="text-slate-500">Ранг {machine.data.rank}+</span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-slate-600 shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 2: Soldier List */}
          {step === 'soldiers' && selectedSquadCandidates && (
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-200">
              {selectedSquadCandidates.candidates.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Нет доступных бойцов</p>
                </div>
              ) : (
                selectedSquadCandidates.candidates.map((candidate) => {
                  const squad = candidate.unit.data as Squad;
                  const soldier = squad.soldiers[candidate.soldierIndex];
                  const isSelected = selectedPilot?.unit.instanceId === candidate.unit.instanceId &&
                                     selectedPilot?.soldierIndex === candidate.soldierIndex;
                  const isCurrentPilot = candidate.alreadyPilot;

                  return (
                    <button
                      key={`${candidate.unit.instanceId}-${candidate.soldierIndex}`}
                      onClick={() => setSelectedPilot(candidate)}
                      disabled={isCurrentPilot}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all active:scale-95",
                        isCurrentPilot
                          ? "bg-green-900/20 border-green-700/50 cursor-default"
                          : isSelected
                            ? "bg-blue-900/30 border-blue-600"
                            : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Soldier Image */}
                        <div className={cn(
                          "w-14 h-14 rounded-lg border overflow-hidden flex-shrink-0 bg-slate-900 relative",
                          isCurrentPilot
                            ? "border-green-700/50"
                            : isSelected
                              ? "border-blue-600"
                              : "border-slate-600"
                        )}>
                          <Image
                            src={getSoldierImage(soldier)}
                            alt={`Боец ${candidate.soldierIndex + 1}`}
                            width={42}
                            height={56}
                            className="w-full h-full object-cover object-center"
                            unoptimized
                          />
                          {/* Rank Badge */}
                          <div className="absolute top-0.5 right-0.5 bg-slate-900/90 px-1 rounded text-[8px] font-bold text-yellow-400">
                            {soldier.rank}
                          </div>
                        </div>

                        {/* Soldier Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">
                              Боец #{candidate.soldierIndex + 1}
                            </span>
                            {isCurrentPilot && (
                              <span className="text-xs font-bold text-green-400">ТЕКУЩИЙ</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Бр: {candidate.soldierArmor}
                            </span>
                            <span>Ранг: {candidate.soldierRank}</span>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && !isCurrentPilot && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex gap-2 flex-shrink-0">
          {step === 'squads' ? (
            // Step 1: Only show cancel button
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-colors min-h-[44px]"
            >
              Отмена
            </button>
          ) : (
            // Step 2: Show cancel, assign, and remove buttons
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Отмена
              </button>
              {hasPilot && (
                <button
                  onClick={handleRemovePilot}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-colors min-h-[44px]"
                >
                  <UserX className="w-4 h-4 inline mr-1" />
                  Убрать
                </button>
              )}
              <button
                onClick={handleAssignPilot}
                disabled={!selectedPilot}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors min-h-[44px]",
                  selectedPilot
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                )}
              >
                <Shield className="w-4 h-4 inline mr-1" />
                Назначить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
