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
};

/** Photo credit per painter/photographer source. */
export const CREDITS = {
  shnayder: { url: 'https://vk.com/shnayder_brush', logo: '/images/credits/shnayder_brush.jpg', name: 'Покрасы Шнайдера' },
  star_system: { url: 'https://vk.com/bp_bnp', logo: '/images/credits/star_system.jpg', name: 'Star System' },
  lisitsin: { url: '', logo: '/images/credits/lisitsin.jpg', name: 'Лисицин' },
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
  protectorate_lyogkaya_kiberpehota: 'shnayder',
  protectorate_shturmovoy_spetsnaz_starye: 'shnayder',
  rutenia_voyska_planety_ruteniya: 'shnayder',
  mercenaries_mutanty: 'shnayder',
  // Лисицин (покрас):
  rutenia_komandnoe_otdelenie: 'lisitsin',
  rutenia_otryad_podderzhki: 'lisitsin',
  rutenia_staraya_gvardiya: 'lisitsin',
  rutenia_pervoprohodtsy: 'lisitsin',
  protectorate_peschanie_sokoly: 'lisitsin',
};

/** Painter credit for a unit, or `undefined` when the squad has no attribution. */
export function getPhotoCredit(unitId: string): typeof CREDITS[PhotoSource] | undefined {
  const source = SQUAD_PHOTO_SOURCE[unitId];
  return source ? CREDITS[source] : undefined;
}
