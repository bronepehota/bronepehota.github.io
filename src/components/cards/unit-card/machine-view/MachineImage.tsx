import { Skull } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';

interface MachineImageProps {
  imageUrl: string;
  machineName: string;
  isDestroyed: boolean;
  onImageClick: () => void;
}

export function MachineImage({ imageUrl, machineName, isDestroyed, onImageClick }: MachineImageProps) {
  return (
    <div className="relative w-16 md:w-20 aspect-[3/4] rounded-sm overflow-hidden flex-shrink-0 bg-slate-900 cursor-pointer shadow-md">
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/40" />
      <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/40" />
      <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/40" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/40" />

      <div onClick={onImageClick} className="w-full h-full overflow-hidden">
        <GitHubPagesImage
          src={imageUrl}
          alt={machineName}
          width={64}
          height={85}
          className="w-full h-full object-cover object-center"
          unoptimized
        />
      </div>

      {/* Destroyed overlay */}
      {isDestroyed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Skull className="w-8 h-8 md:w-10 md:h-10 text-red-500" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}
