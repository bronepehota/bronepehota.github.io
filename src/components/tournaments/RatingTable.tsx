import Link from 'next/link';
import type { RatingRow } from '@/lib/tournament-types';
import CupBadges from './CupBadges';

/** Таблица рейтинга: десктоп — все колонки, мобила скрывает «турниры». */
export default function RatingTable({ rating }: { rating: RatingRow[] }) {
  return (
    <table data-testid="rating-table" className="w-full border-collapse font-ibm-mono text-sm mt-4">
      <thead>
        <tr className="border-b border-military-steel/40 text-left text-[10px] uppercase tracking-[0.2em] text-military-taupe">
          <th className="py-2 pr-2 font-normal">#</th>
          <th className="py-2 pr-2 font-normal">Игрок</th>
          <th className="py-2 pr-2 font-normal hidden md:table-cell">Турниры</th>
          <th className="py-2 pr-2 font-normal">Игры</th>
          <th className="py-2 pr-2 font-normal">Победы</th>
          <th className="py-2 text-right font-normal">%</th>
        </tr>
      </thead>
      <tbody>
        {rating.map((row, i) => (
          <tr
            key={row.player.id}
            data-testid={`rating-row-${row.player.id}`}
            className="border-b border-military-steel/20 hover:bg-military-dark/40 transition-colors"
          >
            <td className="py-2.5 pr-2 text-military-taupe">{i + 1}</td>
            <td className="py-2.5 pr-2">
              <Link
                href={`/players/${row.player.id}`}
                className="font-russo uppercase text-sm text-military-sand hover:text-military-amber transition-colors min-h-[44px] inline-flex items-center"
              >
                {row.player.nick}
              </Link>
              <CupBadges gold={row.gold} silver={row.silver} bronze={row.bronze} className="ml-2" />
            </td>
            <td className="py-2.5 pr-2 hidden md:table-cell text-military-taupe">{row.participations}</td>
            <td className="py-2.5 pr-2">{row.games}</td>
            <td className="py-2.5 pr-2">{row.wins}</td>
            <td className="py-2.5 text-right font-bold text-military-amber">{row.winRateDisplay}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
