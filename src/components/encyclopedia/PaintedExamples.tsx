import { UnitWithType } from '@/lib/encyclopedia-utils';

interface PaintedExamplesProps {
  unit: UnitWithType;
}

export default function PaintedExamples({ unit }: PaintedExamplesProps) {
  // Map unit IDs to their painted example images
  const paintedExamples: Record<string, string[]> = {
    // Polaris squads
    'polaris_lineynaya_klon_pehota': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg',
    ],
    'polaris_lyogkaya_shturmovaya_klon_pehota': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],
    'polaris_tyazhyolaya_shturmovaya_pehota_veliana': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],
    'polaris_rezhimnaya_klon_pehota': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],
    'polaris_tribunatory_starye': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],
    'polaris_tribunatory_novye': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],
    'polaris_tyazhyolyy_shturmovoy_desant': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],
    'polaris_spetsnaz_planety_shidu': [
      '/images/squads/painted-examples/polaris/painted_linear_infantry.jpg', // Reuse for now
    ],

    // Protectorate squads
    'protectorate_lyogkaya_kiberpehota': [
      '/images/squads/painted-examples/protectorate/painted_light_infantry.jpg',
    ],
    'protectorate_shturmovoy_otryad_stervyatniki': [
      '/images/squads/painted-examples/protectorate/painted_assault_infantry_01.jpg',
      '/images/squads/painted-examples/protectorate/painted_assault_infantry_02.jpg',
      '/images/squads/painted-examples/protectorate/painted_assault_infantry_final.jpg',
    ],
    'protectorate_shturmovoy_spetsnaz_novye': [
      '/images/squads/painted-examples/protectorate/painted_assault_infantry_final.jpg',
    ],
    'protectorate_kiberpehota': [
      '/images/squads/painted-examples/protectorate/painted_light_infantry.jpg',
    ],
    'protectorate_kiberspetsnaz': [
      '/images/squads/painted-examples/protectorate/painted_assault_infantry_final.jpg',
    ],

    // Mercenaries squads
    'mercenaries_ohotniki': [
      // TODO: Add painted examples
    ],
    'mercenaries_inoplanety': [
      // TODO: Add painted examples
    ],
  };

  const images = paintedExamples[unit.id] || [];

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-slate-700 pt-6">
      <h3 className="text-lg font-russo text-military-amber mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-military-rust" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0 4.172 4.172a4 4 0 00-.586 4.172 2 2 0 012.828 0 4.172-4.172 4.172 4.4 4.4 0 00-.586 4.172 4.172 4.172 4 4 0 00-.586 4.172-4.172 4.172M9 12H6m6 0H9" />
        </svg>
        Примеры покраски
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group overflow-hidden rounded-lg border border-slate-700 bg-slate-800 hover:border-military-amber/50 transition-all duration-300"
          >
            <div className="aspect-[4/3] relative bg-slate-900">
              <img
                src={image}
                alt={`Покрашенный пример: ${unit.name}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-400 text-center">
                {unit.name} — пример покраски #{index + 1}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-3 italic">
        Изображения предоставлены сообществом. Хотите добавить свои примеры покраски?
      </p>
    </section>
  );
}
