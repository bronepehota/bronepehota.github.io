/**
 * Painted miniature group photos shown as the hero banner at the top of the
 * encyclopedia detail page. Keyed by full unit id.
 *
 * These are wide ("squad assembled") landscape photos — distinct from the
 * per-soldier card art. Only units with a group photo get the wide hero;
 * others fall back to the standard 3:4 portrait header.
 */
export const SQUAD_GROUP_IMAGE: Record<string, string> = {
  polaris_tyazhyolaya_klon_pehota: '/images/squads/polaris/tyazhyolaya_klon_pehota/group.jpg',
  polaris_lyogkaya_shturmovaya_klon_pehota: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/group.jpg',
  polaris_lineynaya_klon_pehota: '/images/squads/polaris/lineynaya_klon_pehota/group.jpg',
  polaris_lyogkiy_shturmovoy_desant: '/images/squads/polaris/lyogkiy_shturmovoy_desant/group.jpg',
  polaris_tribunatory_starye: '/images/squads/polaris/tribunatory_starye/group.jpg',
  protectorate_kiberpehota: '/images/squads/protectorate/kiberpehota/group.jpg',
  rutenia_voyska_planety_ruteniya: '/images/squads/rutenia/voyska_planety_ruteniya/group.jpg',
  protectorate_shturmovoy_spetsnaz_starye: '/images/squads/protectorate/shturmovoy_spetsnaz_starye/group.jpg',
  mercenaries_mutanty: '/images/squads/mercenaries/mutanty/group.jpg',
  protectorate_lyogkaya_kiberpehota: '/images/squads/protectorate/lyogkaya_kiberpehota/group.jpg',
  // Мёртвый Флот (сборные фото отрядов):
  dead_fleet_marodery_erharda: '/images/squads/dead_fleet/marodery_erharda/group.jpg',
  dead_fleet_terrokond: '/images/squads/dead_fleet/terrokond/group.jpg',
  dead_fleet_aboardazhniki_erharda: '/images/squads/dead_fleet/aboardazhniki_erharda/group.jpg',
  dead_fleet_ohotniki_erharda: '/images/squads/dead_fleet/ohotniki_erharda/group.jpg',
  dead_fleet_shturmovye_marodery: '/images/squads/dead_fleet/shturmovye_marodery/group.jpg',
  // Снежные Волки (покрасы Шнайдера, миниатюры — Звёздные Системы):
  snow_wolves_valkyrii: '/images/squads/snow_wolves/valkyrii/group.jpg',
  snow_wolves_ulfhednary: '/images/squads/snow_wolves/ulfhednary/group.jpg',
  snow_wolves_hirdmany: '/images/squads/snow_wolves/hirdmany/group.jpg',
  snow_wolves_huskarly: '/images/squads/snow_wolves/huskarly/group.jpg',
  // Покрасы Лисицына:
  polaris_lineynaya_klon_pehota_fox1: '/images/squads/polaris/lineynaya_klon_pehota_fox1/group.jpg',
  protectorate_spetsnaz_planety_felitsiya_fox1: '/images/squads/protectorate/spetsnaz_planety_felitsiya_fox1/group.jpg',
  rutenia_pervoprohodtsy: '/images/squads/rutenia/pervoprohodtsy/group.jpg',
  protectorate_ekspeditsionnyy_otryad_nyu_rodezii: '/images/squads/protectorate/ekspeditsionnyy_otryad_nyu_rodezii/group.jpg',
};

/** Photo credit per painter/photographer source. */
export const CREDITS = {
  shnayder: { url: 'https://vk.com/shnayder_brush', logo: '/images/credits/shnayder_brush.jpg', name: 'Покрасы Шнайдера' },
  star_system: { url: 'https://vk.com/bp_bnp', logo: '/images/credits/star_system.jpg', name: 'Star System' },
  // Звёздные Системы (vk.ru/universestarsys) — сообщество-создатель миниатюр
  // Мёртвого Флота. Отличается от группы Star System (bp_bnp).
  universestarsys: { url: 'https://vk.ru/universestarsys', logo: '/images/credits/universestarsys.jpg', name: 'Звёздные Системы' },
  tehnolog: { url: 'https://www.tehnolog.ru', logo: '/images/credits/tehnolog.png', name: 'Технолог' },
  lisitsin: { url: 'https://vk.ru/fredfoxminiatures', logo: '/images/credits/lisitsin.jpg', name: 'Миниатюры Лисицина' },
  // Андрей Суков — покрас лёгкой киберпехоты (vk.ru/sukov85). Лого ожидается от автора;
  // пока `logo: ''` ⇒ chip рендерится без картинки (имя + ссылка), без битого <img>.
  sukov: { url: 'https://vk.ru/sukov85', logo: '', name: 'Андрей Суков' },
  // TODO(аттрибуция): ждём лого + ссылку + список отрядов Сергея Переверзева.
  pereverzev: { url: '', logo: '/images/credits/pereverzev.jpg', name: 'Сергей Переверзев' },
} as const;
export type PhotoSource = keyof typeof CREDITS;

/**
 * Per-squad photo source — who painted each squad's images. ONLY squads listed
 * here are considered "painted" (and thus show a painter chip on the detail page);
 * any squad absent from this map has no painter attribution (generic/card art).
 */
export const SQUAD_PHOTO_SOURCE: Record<string, PhotoSource> = {
  // Покрасы Шнайдера:
  polaris_tyazhyolaya_klon_pehota: 'shnayder',
  polaris_lyogkaya_shturmovaya_klon_pehota: 'shnayder',
  polaris_lineynaya_klon_pehota: 'shnayder',
  polaris_lyogkiy_shturmovoy_desant: 'shnayder',
  polaris_tribunatory_starye: 'shnayder',
  protectorate_kiberpehota: 'shnayder',
  protectorate_shturmovoy_spetsnaz_starye: 'shnayder',
  mercenaries_mutanty: 'shnayder',
  // Технолог (официальные миниатюры):
  rutenia_voyska_planety_ruteniya: 'shnayder',
  rutenia_ruteniyskaya_gvardiya: 'shnayder',
  // Мёртвый Флот (покрасы Шнайдера, миниатюры — Звёздные Системы):
  dead_fleet_marodery_erharda: 'shnayder',
  dead_fleet_terrokond: 'shnayder',
  dead_fleet_aboardazhniki_erharda: 'shnayder',
  dead_fleet_ohotniki_erharda: 'shnayder',
  dead_fleet_shturmovye_marodery: 'shnayder',
  dead_fleet_mark_ballard: 'shnayder',
  // Андрей Суков (покрас лёгкой киберпехоты — ранее ошибочно приписан Шнайдеру):
  protectorate_lyogkaya_kiberpehota: 'sukov',
  // Снежные Волки (покрасы Шнайдера, миниатюры — Звёздные Системы):
  snow_wolves_valkyrii: 'shnayder',
  snow_wolves_ulfhednary: 'shnayder',
  snow_wolves_hirdmany: 'shnayder',
  snow_wolves_huskarly: 'shnayder',
  // Лисицин (покрас):
  rutenia_komandnoe_otdelenie: 'lisitsin',
  rutenia_otryad_podderzhki: 'lisitsin',
  rutenia_staraya_gvardiya: 'lisitsin',
  rutenia_pervoprohodtsy: 'lisitsin',
  protectorate_peschanie_sokoly: 'lisitsin',
  polaris_lineynaya_klon_pehota_fox1: 'lisitsin',
  protectorate_spetsnaz_planety_felitsiya_fox1: 'lisitsin',
  protectorate_ekspeditsionnyy_otryad_nyu_rodezii: 'lisitsin',
  // NB: «линейка Fox» — рендеры Лисицына; Fox.1 теперь ПОКРАШЕН им же (см. выше),
  // остальные Fox-отряды без чипа покраса (// ИЗОБРАЖЕНИЯ → imageSource field). Скульптор = Лисицын (в нейминге Fox.N).
};

/** Painter credit for a unit, or `undefined` when the squad has no attribution. */
export function getPhotoCredit(unitId: string): typeof CREDITS[PhotoSource] | undefined {
  const source = SQUAD_PHOTO_SOURCE[unitId];
  return source ? CREDITS[source] : undefined;
}

/**
 * Per-squad RENDER source — who made the 3D model / card-art render for UNPAINTED
 * squads. Lives as a `miniatureSource` FIELD on the encyclopedia unit (data-driven,
 * like `provenance`), holding a credit id from `CREDITS`. Resolve it via `getCredit`.
 */
export function getCredit(id: string): typeof CREDITS[PhotoSource] | undefined {
  return (CREDITS as Record<string, typeof CREDITS[PhotoSource]>)[id];
}
