'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoreSectionProps {
  className?: string;
}

interface Era {
  id: string;
  title: string;
  period: string;
  description: string;
  accent: string;
}

const eras: Era[] = [
  {
    id: 'golden-age',
    title: 'Золотой век',
    period: 'Эпоха Великого Исхода',
    description: 'Человечество устремилось к звёздам. Колонии процветали на сотнях планет, технологии процветали, и казалось, что нет границ возможному. Надежда на лучшее будущее объединяла все миры Империи.',
    accent: 'border-military-rust',
  },
  {
    id: 'dark-times',
    title: 'Тёмные времена',
    period: 'Эпоха Изоляции',
    description: 'Связь с метрополией была потеряна. Корабли исчезали в гиперпространстве, колонии погрузились в хаос. Торговые пути разрушились, и миры были предоставлены сами себе. Из тьмы выросли новые угрозы.',
    accent: 'border-military-steel',
  },
  {
    id: 'war-era',
    title: 'Эра войн',
    period: 'Эпоха Перемирия',
    description: 'Империя возродилась, но изменилась. Теперь она — тень былого величия, окрылённая жестокостью и тиранией. Протекторат поднял знамя восстания, и галактика горит в огне войны. Исход близок.',
    accent: 'border-military-red',
  },
];

export default function LoreSection({ className }: LoreSectionProps) {
  useEffect(() => {
    // Intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.3 }
    );

    const eraElements = document.querySelectorAll('[data-era-index]');
    eraElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={cn(
        'relative py-20 md:py-32 px-4 md:px-8 overflow-hidden',
        'bg-military-dark diagonal-stripes',
        className
      )}
    >
      {/* Section header with tactical decorations */}
      <div className="max-w-6xl mx-auto mb-16 md:mb-24">
        <div className="relative fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          {/* Tactical brackets */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-military-rust/30" />
          <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-military-rust/30" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-military-rust/30" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-military-rust/30" />

          <h2 className="font-russo text-3xl md:text-5xl text-center military-text-gradient mb-4 px-8">
            ВСЕЛЕННАЯ
          </h2>
          <div className="military-divider max-w-md mx-auto" />

          {/* Status indicator */}
          <div className="text-center mt-4 font-ibm-mono text-[8px] text-military-rust/50">
            <span className="animate-pulse">◆</span>
            <span className="ml-2">DATA_SYNC: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Eras grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {eras.map((era, index) => (
          <div
            key={era.id}
            data-era-index={index.toString()}
            className={cn(
              'folded-paper military-corners p-6 md:p-8',
              'fade-in-up opacity-0',
              `stagger-${index + 1}`
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            {/* Era number with tactical styling */}
            <div className="relative mb-4">
              <div className="font-ibm-mono text-xs text-military-rust/60">
                {'0' + (index + 1)} {/* // ERA_RECORD */}
              </div>
              {/* Scanning effect */}
              <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-military-rust/30 to-transparent animate-shine" />
            </div>

            {/* Era title with glitch effect on hover */}
            <h3 className={cn(
              'font-oswald font-semibold text-xl md:text-2xl text-military-sand mb-2',
              'border-l-4', era.accent, 'pl-4',
              'military-glitch'
            )}>
              {era.title}
            </h3>

            {/* Period */}
            <div className="font-ibm-mono text-xs text-military-steel mb-4 uppercase tracking-wider">
              {era.period}
            </div>

            {/* Description with typewriter effect */}
            <p className="font-oswald text-sm md:text-base text-military-taupe leading-relaxed">
              {era.description}
            </p>

            {/* Tactical data at bottom */}
            <div className="mt-6 pt-4 border-t border-military-steel/30">
              <div className="flex items-center justify-between">
                <div className="font-ibm-mono text-[10px] text-military-steel/50">
                  <span className="animate-pulse">▪</span>
                  STATUS_{era.id.toUpperCase()}
                </div>
                <div className="font-ibm-mono text-[10px] text-military-steel/50">
                  {index === 0 ? 'ACTIVE' : 'ARCHIVED'}
                </div>
              </div>
            </div>

            {/* Glitch effect on hover */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-military-rust/5 to-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* Section divider with tactical elements */}
      <div className="max-w-6xl mx-auto mt-16 md:mt-24 relative">
        <div className="military-divider" />

        {/* Binary data stream effect */}
        <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden opacity-30">
          <div className="flex gap-2 animate-shine" style={{ animationDuration: '8s' }}>
            <span className="font-ibm-mono text-[8px] text-military-rust/40">01001101</span>
            <span className="font-ibm-mono text-[8px] text-military-rust/40">10101010</span>
            <span className="font-ibm-mono text-[8px] text-military-rust/40">00110011</span>
            <span className="font-ibm-mono text-[8px] text-military-rust/40">11010001</span>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radar sweep in corner */}
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
          <div className="w-full h-full border border-military-steel/20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1/2 bg-gradient-to-t from-military-steel to-transparent origin-bottom animate-radar-scan" />
          </div>
        </div>

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-military-rust/5 via-transparent to-military-steel/5" />
        </div>
      </div>
    </section>
  );
}
