'use client';

import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { Skull, Footprints } from 'lucide-react';

interface SoldierImageProps {
  imageUrl: string;
  soldierIndex: number;
  isDead: boolean;
  isInPanic: boolean;
  isMounted: boolean;
  isPilot?: boolean;
  onImageClick: () => void;
}

export function SoldierImage({
  imageUrl,
  soldierIndex,
  isDead,
  isInPanic,
  isMounted,
  isPilot = false,
  onImageClick,
}: SoldierImageProps) {
  return (
    <div data-testid="soldier-photo" className="relative w-16 md:w-20 aspect-[3/4] rounded-sm overflow-hidden flex-shrink-0 bg-slate-900 cursor-pointer shadow-md">
      <div onClick={onImageClick} className="w-full h-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={`Солдат ${soldierIndex + 1}`}
          width={60}
          height={80}
          className="w-full h-full object-cover object-center"
          unoptimized
        />
      </div>

      {/* Pilot badge - top left */}
      {isPilot && (
        <div className="absolute top-1 left-1 z-10">
          <div className="px-1 py-0.5 backdrop-blur-md bg-cyan-950/80 border border-cyan-600/50 rounded-sm">
            <span className="font-mono text-[8px] font-black text-cyan-300 uppercase tracking-wider">
              ПИЛОТ
            </span>
          </div>
        </div>
      )}

      {/* Soldier number HUD — flush top-right corner, ghost (playtest:
          bordered chip was too heavy over the photo). Same construction as
          the ГОТОВ chip in the opposite corner: px-1 py-0.5 leading-4. */}
      <div className="absolute top-0 right-0 z-10">
        <div className="flex items-center h-5 px-1 bg-slate-950/30 rounded-bl-sm">
          <span className="font-mono text-[10px] font-bold text-white/70">
            #{soldierIndex + 1}
          </span>
        </div>
      </div>

      {/* Death overlay */}
      {isMounted && isDead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Skull
            className="w-8 h-8 md:w-10 md:h-10 text-red-500"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 12px rgba(239,68,68,1))' }}
          />
        </div>
      )}

      {/* Done state: the emerald done button in the bottom-left corner IS the
          indicator — no centered overlay (it would fight the button visually). */}

      {/* Panic overlay */}
      {isMounted && isInPanic && !isDead && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/30">
          <Footprints
            className="w-8 h-8 md:w-10 md:h-10 text-orange-400"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 8px rgba(251,146,60,0.8))' }}
          />
        </div>
      )}
    </div>
  );
}
