import Link from 'next/link';
import TacticalFrame from './TacticalFrame';
// Серверобезопасный источник: сам AttributionLabel клиентский — из
// Server Component его модуль импортировать нельзя (упало на билде).
import { CONTRIBUTION_VK_URL } from '@/lib/constants';

/**
 * «Напоминалка» для организаторов (идея Дениса Шнайдера, 2026-11-02):
 * критерии попадания турнира в общий рейтинг + что прислать с протоколом.
 * Контент в компоненте (справочная страница); правки = PR, отдельный JSON не нужен.
 */
const CRITERIA: Array<{ title: string; body: string }> = [
  {
    title: 'Система подсчёта',
    body:
      'На каждого игрока в каждом туре фиксируются: победа (или поражение), очки режима и очки армии. ' +
      'Рейтинг считается как в приложении: % побед → партии → очки режима → очки армии.',
  },
  {
    title: 'Открытый турнир',
    body:
      'Анонс и освещение в сети (сообщества VK и т.п.), записаться может любой желающий — ' +
      'турнир не закрытый клубный.',
  },
  {
    title: 'Регламент',
    body:
      'Играется по нашему регламенту — либо по изменённому/своему варианту на его основе.',
  },
  {
    title: 'Судья',
    body:
      'На турнире есть назначенный судья: следит за соблюдением регламента и разбирает спорные ситуации.',
  },
];

/** Критерии рейтинга и порядок подачи итогов — для организаторов турниров. */
export default function OrganizersGuide() {
  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/tournaments"
          className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust hover:text-military-amber transition-colors no-underline inline-block min-h-[44px] leading-[44px]"
        >
          ← ТУРНИРЫ
        </Link>

        <TacticalFrame stripes className="mt-2 px-5 py-5 md:px-8 md:py-6">
          <div className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust">
            {'// ОРГАНИЗАТОРАМ'}
          </div>
          <h1 className="font-russo text-2xl md:text-3xl uppercase tracking-wider mt-1">
            Критерии рейтинга
          </h1>
          <p className="font-ibm-mono text-xs text-military-taupe mt-3">
            турнир попадает в общий рейтинг игроков, если при проведении учтено:
          </p>
        </TacticalFrame>

        <ol className="mt-6 space-y-3">
          {CRITERIA.map((c, i) => (
            <li
              key={c.title}
              data-testid="criterion"
              className="border border-military-steel/40 bg-military-charcoal/40 p-4"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-russo text-xl leading-none text-military-amber">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="font-russo uppercase tracking-wider text-base">{c.title}</h2>
              </div>
              <p className="font-ibm-mono text-xs text-military-taupe mt-2 leading-relaxed">
                {c.body}
              </p>
            </li>
          ))}
        </ol>

        <section className="mt-10">
          <h2 className="font-russo uppercase tracking-wider text-lg">Как попасть в рейтинг</h2>
          <ul className="mt-3 font-ibm-mono text-xs text-military-taupe space-y-2 leading-relaxed">
            <li className="border-l-2 border-l-military-steel/60 pl-3">
              итоговые места всех участников;
            </li>
            <li className="border-l-2 border-l-military-steel/60 pl-3">
              протокол по турам: пары и столы, победа/поражение, очки режима и очки армии на
              каждого игрока;
            </li>
            <li className="border-l-2 border-l-military-steel/60 pl-3">
              армлисты: фракция, состав, очки — как на страницах турниров.
            </li>
          </ul>
          <p className="font-ibm-mono text-xs text-military-taupe mt-4">
            Прислать итоги:{' '}
            <a
              data-testid="organizers-vk-link"
              href={CONTRIBUTION_VK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-military-sand/80 hover:text-military-amber transition-colors underline decoration-dotted decoration-military-steel/60 underline-offset-4 py-1"
            >
              сообщество «Бронепехота» (VK)
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
