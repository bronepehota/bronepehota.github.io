'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { FactionID } from '@/lib/types';
import { X } from 'lucide-react';
import { rollDie } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';

interface InitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  factionId: FactionID;
  activeUnitsCount?: number;
  context: 'preparation' | 'turn';
}

export default function InitiativeModal({
  isOpen,
  onClose,
  onConfirm,
  factionId,
  activeUnitsCount = 0,
  context
}: InitiativeModalProps) {
  useEscapeToClose(isOpen, onClose);
  const [initRoll, setInitRoll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  const calculateInitiative = useCallback(() => {
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setInitRoll(rollDie(6));
      count++;
      if (count > 10) {
        clearInterval(interval);
        const final = rollDie(6);
        setInitRoll(final);
        setIsRolling(false);
      }
    }, 50);
  }, []);

  // Auto-roll when modal opens
  useEffect(() => {
    if (isOpen) {
      calculateInitiative();
    }
  }, [isOpen, calculateInitiative]);

  const handleConfirm = useCallback(() => {
    if (isRolling) return;
    onConfirm();
  }, [isRolling, onConfirm]);

  if (!isOpen) return null;

  const factionColors = getFactionColors(factionId);
  const buttonText = context === 'preparation' ? 'НАЧАТЬ БОЙ' : 'НАЧАТЬ ТУР';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-2 md:p-4 backdrop-blur-xl animate-in fade-in duration-300" data-testid="initiative-modal">
      <div className={cn(
        "relative border-2 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-sm w-full shadow-2xl text-center space-y-4 md:space-y-6 animate-in zoom-in duration-300 mx-auto max-h-[90vh] overflow-hidden",
        factionColors.border,
        factionColors.bg,
        factionColors.glow
      )}>
        {/* Corner accents */}
        <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", factionColors.accent)} />
        <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", factionColors.accent)} />
        <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", factionColors.accent)} />
        <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", factionColors.accent)} />

        {/* Header with close button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          <h3 className={cn("text-lg md:text-xl font-mono font-bold tracking-wider", factionColors.text)}>
            ИНИЦИАТИВА
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="p-1 hover:bg-slate-800/50 rounded-sm transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Закрыть"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Dice display */}
        <div className="flex justify-center">
          <div className={cn(
            "relative w-20 h-20 md:w-28 md:h-28 bg-slate-900/80 rounded-2xl md:rounded-3xl border-4 flex items-center justify-center text-4xl md:text-6xl font-mono font-black shadow-2xl transition-all",
            factionColors.border,
            isRolling ? "scale-110 rotate-12" : "scale-100 rotate-0",
            factionColors.text
          )} data-testid="initiative-dice">
            {initRoll}
            {/* Corner accents on dice */}
            <div className={cn("absolute top-1 left-1 w-2 h-2 border-l border-t opacity-50", factionColors.accent)} />
            <div className={cn("absolute bottom-1 right-1 w-2 h-2 border-r border-b opacity-50", factionColors.accent)} />
          </div>
        </div>

        {/* Stats - only show in turn context */}
        {context === 'turn' && (
          <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-slate-700/50 space-y-2">
            <div className="flex justify-between items-center text-xs md:text-sm font-mono">
              <span className="uppercase tracking-wider text-slate-500">БОЕСПОСОБНЫХ:</span>
              <span className={cn("font-black text-base md:text-lg", factionColors.text)}>{activeUnitsCount}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Reroll button */}
          <button
            onClick={calculateInitiative}
            disabled={isRolling}
            className={cn(
              "flex-1 py-3 md:py-4 font-mono text-sm md:text-base font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
              "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50 hover:text-slate-300",
              "disabled:opacity-50"
            )}
            data-testid="reroll-button"
          >
            ПЕРЕБРОС
          </button>

          {/* Start turn button */}
          <button
            onClick={handleConfirm}
            data-testid="confirm-initiative-button"
            disabled={isRolling}
            className={cn(
              "flex-[2] py-3 md:py-4 font-mono text-sm md:text-lg font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
              factionColors.border,
              factionColors.bg,
              factionColors.text,
              "hover:scale-102 active:scale-95 disabled:opacity-50"
            )}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

