/**
 * Shared modifier icon rendering utilities.
 * Supports both Lucide icon names and external URL images.
 */

'use client';

import {
  Sparkles, ShieldOff, Flag, Radio, Sword, Shield, Syringe, Snail,
  Crosshair, Eye, Frown, Target, Heart, Wind, Flame, Snowflake,
  Timer, AlertTriangle, ShieldCheck, Swords, Skull, Zap, Bug,
  ArrowUp, ChevronsUp, Wrench,
} from 'lucide-react';

export const MODIFIER_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, ShieldOff, Flag, Radio, Sword, Shield, Syringe, Snail,
  Crosshair, Eye, Frown, Target, Heart, Wind, Flame, Snowflake,
  Timer, AlertTriangle, ShieldCheck, Swords, Skull, Zap, Bug,
  ArrowUp, ChevronsUp, Wrench,
};

export const MODIFIER_ICON_OPTIONS = Object.keys(MODIFIER_ICON_MAP);

export interface ModifierIconProps {
  name?: string;
  className?: string;
  size?: number;
}

/**
 * Renders a modifier icon. Supports:
 * - Lucide icon name (e.g. "Sparkles", "Flag")
 * - External URL (starts with http:// or https://)
 * - Fallback to Sparkles
 */
export function ModifierIcon({ name, className, size = 16 }: ModifierIconProps) {
  const sizeStyle = { width: size, height: size };

  if (name) {
    // External URL
    // eslint-disable-next-line @next/next/no-img-element
    if (name.startsWith('http://') || name.startsWith('https://')) {
      return (
        <img
          src={name}
          alt=""
          width={size}
          height={size}
          className={className}
          style={sizeStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    // Lucide icon name
    if (MODIFIER_ICON_MAP[name]) {
      const IconComponent = MODIFIER_ICON_MAP[name];
      return <IconComponent className={className} />;
    }
  }
  return <Sparkles className={className} />;
}
