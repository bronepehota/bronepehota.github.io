'use client';

import { RulesVersionID } from '@/lib/types';
import { X, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface RulesInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  rulesVersion: RulesVersionID;
}

const TEHNOLOG_CONTENT = (
  <>
    <h3 className="font-semibold mb-3 text-lg">Официальные правила (Технолог)</h3>
    <p className="mb-2"><strong>Попадание</strong>: Бросок кубика дальности должен быть больше или равен расстоянию до цели</p>
    <p className="mb-2"><strong>Урон по пехоте</strong>: Каждый кубик, пробивающий броню цели, наносит 1 ранение</p>
    <p className="mb-4"><strong>Урон по технике</strong>: Каждый кубик, пробивающий броню, наносит 1 повреждение</p>

    <h4 className="font-semibold mb-2">Укрепления</h4>
    <ul className="list-disc pl-5 mb-4 space-y-1">
      <li>Без укрытия: +0 к броне</li>
      <li>Лёгкое (менее 50%): +1 к броне</li>
      <li>Полное (более 50%): +2 к броне</li>
    </ul>

    <p className="text-sm text-slate-400 italic">Источник: docs/original/official_rules.txt</p>
  </>
);

const COMMUNITY_CONTENT = (
  <>
    <h3 className="font-semibold mb-3 text-lg">Правила от Сообщества Star System</h3>
    <p className="mb-2"><strong>Попадание</strong>: Бросок кубика дальности должен быть больше или равен расстоянию до цели</p>
    <p className="mb-2"><strong>Урон по пехоте</strong>: Каждый кубик, пробивающий броню цели, наносит 1 ранение</p>
    <p className="mb-4"><strong>Урон по технике</strong>: Сравнение с зоной прочности<br />
      <span className="text-sm opacity-80">D6 = 1 урон, D12 = 2 урона, D20 = 3 урона при пробитии</span></p>

    <h4 className="font-semibold mb-2">Укрепления</h4>
    <ul className="list-disc pl-5 mb-4 space-y-1">
      <li>Без укрытия: +0 к дистанции</li>
      <li>Лёгкое (менее 50%): +1 к дистанции</li>
      <li>Полное (более 50%): +2 к дистанции</li>
    </ul>

    <p className="text-sm text-slate-400 italic">Источник: docs/panov/fan_rules.txt</p>
  </>
);

export function RulesInfoModal({ isOpen, onClose, rulesVersion }: RulesInfoModalProps) {
  if (!isOpen) return null;

  const content = rulesVersion === 'tehnolog' ? TEHNOLOG_CONTENT : COMMUNITY_CONTENT;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={clsx(
        'fixed inset-0 z-[200] flex items-center justify-center p-4',
        'transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative glass-strong rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Правила расчёта боя</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {content}
        </div>
      </div>
    </div>
  );
}
