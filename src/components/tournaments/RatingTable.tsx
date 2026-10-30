import Link from 'next/link';
import type { RatingRow } from '@/lib/tournament-types';
import { cn } from '@/lib/utils';
import CupBadges from './CupBadges';

const PLACE_RAIL: Record<number, string> = {
  1: 'border-l-2 border-l-amber-400',
  2: 'border-l-2 border-l-slate-300',
  3: 'border-l-2 border-l-amber-700',
};

/** Сегментная полоса партий: закрашенный сегмент = победа, контур = поражение.
 *  Читается как боекомплект в HUD — видно и счёт, и динамику без чтения чисел. */
function WinBar({ games, wins }: { games: number; wins: number }) {
  const shown = Math.min(games, 20);
  return (
    <span className="inline-flex items-center gap-[2px] align-middle" title={`${wins} побед из ${games} партий`}>
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={i}
          className={cn(
            'w-2 h-3.5',
            i < wins ? 'bg-military-amber' : 'border border-military-steel/60',
          )}
        />
      ))}
      {games > shown && (
        <span className="font-ibm-mono text-[9px] text-military-taupe">+{games - shown}</span>
      )}
    </span>
  );
}

/** Таблица рейтинга: стенсил-места, рейки топ-3, сегментные полосы партий.
 *  Десктоп — все колонки; мобила — место/игрок/полоса/%. */
export default function RatingTable({ rating }: { rating: RatingRow[] }) {
  return (
    <table data-testid="rating-table" className="w-full border-collapse font-ibm-mono text-sm mt-4">
      <thead>
        <tr className="border-b-2 border-military-steel/40 text-left text-[10px] uppercase tracking-[0.2em] text-military-taupe">
          <th className="py-2 pr-2 font-normal w-8">№</th>
          <th className="py-2 pr-2 font-normal">Игрок</th>
          <th className="py-2 pr-2 font-normal">Партии</th>
          <th className="py-2 pr-2 font-normal hidden md:table-cell">Турниры</th>
          <th className="py-2 pr-2 font-normal hidden md:table-cell">Игры</th>
          <th className="py-2 pr-2 font-normal hidden md:table-cell">Победы</th>
          <th className="py-2 text-right font-normal">%</th>
        </tr>
      </thead>
      <tbody>
        {rating.map((row, i) => {
          const place = i + 1;
          return (
            <tr
              key={row.player.id}
              data-testid={`rating-row-${row.player.id}`}
              className={cn(
                'border-b border-military-steel/20 hover:bg-military-charcoal/60 transition-colors',
                PLACE_RAIL[place],
              )}
            >
              <td
                className={cn(
                  'py-2.5 pr-2 font-russo text-lg leading-none',
                  place <= 3 ? 'text-military-amber' : 'text-military-taupe/70',
                )}
              >
                {place}
              </td>
              <td className="py-2.5 pr-2">
                <Link
                  href={`/players/${row.player.id}`}
                  className="font-russo uppercase text-sm text-military-sand hover:text-military-amber transition-colors min-h-[44px] inline-flex items-center"
                >
                  {row.player.nick}
                </Link>
                <CupBadges gold={row.gold} silver={row.silver} bronze={row.bronze} className="ml-2" />
              </td>
              <td className="py-2.5 pr-2">
                <WinBar games={row.games} wins={row.wins} />
              </td>
              <td className="py-2.5 pr-2 hidden md:table-cell text-military-taupe">{row.participations}</td>
              <td className="py-2.5 pr-2 hidden md:table-cell">{row.games}</td>
              <td className="py-2.5 pr-2 hidden md:table-cell">{row.wins}</td>
              <td className="py-2.5 text-right font-bold text-military-amber">{row.winRateDisplay}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
