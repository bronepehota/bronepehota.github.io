import type { ComponentType } from 'react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { factionLogos } from '@/lib/faction-colors';
import { cn } from '@/lib/utils';

interface FactionLogoProps {
  faction: string;
  /** Classes for the logo <img> (defaults to w-full h-full). Use with a sized parent. */
  className?: string;
  /** Icon shown when no logo exists for the faction (e.g. mercenaries). */
  fallback?: ComponentType<{ className?: string }>;
  /** Classes for the fallback icon (e.g. include the faction text-color). */
  fallbackClassName?: string;
}

/**
 * Renders a faction's logo image when available (polaris, protectorate),
 * otherwise the provided fallback icon (for mercenaries). Drop-in replacement
 * for the Lucide Shield/Zap/Skull faction icons.
 */
export function FactionLogo({ faction, className, fallback: Fallback, fallbackClassName }: FactionLogoProps) {
  const logo = factionLogos[faction as keyof typeof factionLogos];
  if (logo) {
    return <GitHubPagesImage src={logo} alt={`Фракция ${faction}`} className={cn('object-contain', className ?? 'w-full h-full')} />;
  }
  if (Fallback) {
    return <Fallback className={fallbackClassName ?? className ?? 'w-full h-full'} />;
  }
  return null;
}
