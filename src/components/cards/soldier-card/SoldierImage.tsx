'use client';

import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { CheckCircle2, Skull, Footprints } from 'lucide-react';

interface SoldierImageProps {
  imageUrl: string;
  soldierIndex: number;
  isDead: boolean;
  isDone: boolean;
  isInPanic: boolean;
  isMounted: boolean;
  isPilot?: boolean;
  onImageClick: () => void;
}

export function SoldierImage({
  imageUrl,
  soldierIndex,
  isDead,
  isDone,
  isInPanic,
  isMounted,
  isPilot = false,
  onImageClick,
}: SoldierImageProps) {
  return (
    <div className="relative w-16 md:w-20 aspect-[3/4] rounded-sm overflow-hidden flex-shrink-0 bg-slate-900 cursor-pointer shadow-md">
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

      {/* Soldier number HUD */}
      <div className="absolute bottom-1 right-1 z-10">
        <div className="px-1.5 py-0.5 backdrop-blur-md bg-slate-900/70 border border-slate-600/50 rounded-sm">
          <span className="font-mono text-[10px] font-bold text-white">
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

      {/* Done overlay */}
      {isMounted && isDone && !isDead && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-emerald-500 rounded-full p-1 md:p-1.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Panic overlay */}
      {isMounted && isInPanic && !isDead && !isDone && (
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
