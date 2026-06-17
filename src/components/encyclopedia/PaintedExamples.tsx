import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import Image from 'next/image';

interface PaintedExamplesProps {
  unit: EncyclopediaUnit;
}

export default function PaintedExamples({ unit }: PaintedExamplesProps) {
  // Map unit IDs to their painted-example photos. NOTE: none of these assets
  // exist yet — the map is intentionally empty so the section renders nothing
  // (rather than broken images) until real painted-example photos are added
  // under public/images/squads/painted-examples/.
  const paintedExamples: Record<string, string[]> = {};

  const images = paintedExamples[unit.id] || [];

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="folded-paper military-corners p-4">
      <h3 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-military-rust" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Примеры покраски
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group overflow-hidden rounded-sm border border-military-steel/30 bg-military-charcoal/50 hover:border-military-amber/50 transition-all duration-300"
          >
            <div className="aspect-[4/3] relative bg-military-dark">
              <Image
                src={image}
                alt={`Покрашенный пример: ${unit.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-military-dark/80 to-transparent" />
            </div>
            <div className="p-3">
              <p className="font-ibm-mono text-xs text-military-steel text-center">
                {unit.name} — пример #{index + 1}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="font-ibm-mono text-[10px] text-military-steel/60 mt-3 italic uppercase tracking-wider">
        Изображения предоставлены сообществом Robogear
      </p>
    </section>
  );
}
