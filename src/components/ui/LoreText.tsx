import { splitParagraphs } from '@/lib/text-format';

interface LoreTextProps {
  /** Длинный текст с `\n\n`-абзацами (одноабзацный — просто строка). */
  text?: string | null;
  /** Класс абзаца (типографика): цвет, кегль, интерлиньяж. */
  className?: string;
}

/** Длинный текст досье: каждый `\n\n`-абзац — свой <p> с межабзацным ритмом. */
export function LoreText({ text, className }: LoreTextProps) {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return null;
  if (paragraphs.length === 1) {
    return <p className={className}>{paragraphs[0]}</p>;
  }
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className={className}>{paragraph}</p>
      ))}
    </div>
  );
}
