import Link from 'next/link';
import { factionLink, linkComposition } from '@/lib/roster-links';

/** Фракция протокола: известная — ссылка на якорь фракции в энциклопедии. */
export function FactionLabel({ faction }: { faction: string }) {
  const fac = factionLink(faction);
  if (!fac) {
    return (
      <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
        {faction}
      </span>
    );
  }
  return (
    <Link
      href={`/encyclopedia/factions#${fac}`}
      title="фракция в энциклопедии"
      className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust hover:text-military-amber underline decoration-dotted decoration-military-rust/40 underline-offset-4 transition-colors"
    >
      {faction}
    </Link>
  );
}

/** Состав армлиста: узнанные юниты — ссылки на страницы энциклопедии,
 *  остальное — текстом (строгие совпадения, без ложных ссылок). */
export function CompositionText({
  composition,
  unitIdx,
}: {
  composition: string;
  unitIdx: Map<string, string[]>;
}) {
  return (
    <>
      {linkComposition(composition, unitIdx).map((part, k) => (
        <span key={k}>
          {part.unitId ? (
            <Link
              href={`/encyclopedia/unit/${part.unitId}`}
              title="в энциклопедии"
              className="text-military-sand/90 hover:text-military-amber underline decoration-dotted decoration-military-steel/60 underline-offset-4 transition-colors"
            >
              {part.text}
            </Link>
          ) : (
            <span>{part.text}</span>
          )}
          {part.sep}
        </span>
      ))}
    </>
  );
}
