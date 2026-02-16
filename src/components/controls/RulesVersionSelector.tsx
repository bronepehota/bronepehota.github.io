'use client';

import { RulesVersionID } from '@/lib/types';

interface RulesVersionSelectorProps {
  selectedVersion: RulesVersionID;
  _onVersionChange: (id: RulesVersionID) => void;
}

export default function RulesVersionSelector({
  selectedVersion,
  _onVersionChange
}: RulesVersionSelectorProps) {
  // Get version name for display
  const getVersionName = (id: RulesVersionID): string => {
    return id === 'tehnolog' ? 'Технолог' : 'Сообщество';
  };

  // Get version color for badge
  const getVersionColor = (id: RulesVersionID): string => {
    return id === 'tehnolog' ? '#ef4444' : '#3b82f6';
  };

  const handleScrollToRules = () => {
    const rulesElement = document.getElementById('rules-selector');
    if (rulesElement) {
      rulesElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <button
      onClick={handleScrollToRules}
      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all min-h-[44px]"
      aria-label={`Перейти к выбору версии правил (текущая: ${getVersionName(selectedVersion)})`}
    >
      <span className="text-[10px] md:text-xs opacity-60 uppercase tracking-wider hidden md:inline">
        Версия:
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs md:text-sm font-medium">
          {getVersionName(selectedVersion)}
        </span>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: getVersionColor(selectedVersion) }}
        />
      </div>
    </button>
  );
}
