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
  star_system: { url: 'https://vk.com/bp_bnp', logo: '/images/credits/bp_bnp.jpg', name: 'Star System' },
} as const;
export type PhotoSource = keyof typeof CREDITS;

/**
 * Per-squad photo source — who painted/photographed each squad's images.
 * Rule (per user): the new painted squads are Покрасы Шнайдера; flip an entry to
 * 'star_system' if a squad's photos actually come from Star System (bp_bnp).
 */
export const SQUAD_PHOTO_SOURCE: Record<string, PhotoSource> = {
  polaris_tyazhyolaya_klon_pehota: 'shnayder',
  polaris_lyogkaya_shturmovaya_klon_pehota: 'shnayder',
  polaris_lineynaya_klon_pehota: 'shnayder',
  polaris_lyogkiy_shturmovoy_desant: 'shnayder',
  polaris_tribunatory_starye: 'shnayder',
  protectorate_kiberpehota: 'shnayder',
  rutenia_voyska_planety_ruteniya: 'shnayder',
  protectorate_shturmovoy_spetsnaz_starye: 'shnayder',
  mercenaries_mutanty: 'shnayder',
};

/** Photo credit for a unit (defaults to Shnaider for painted squads). */
export function getPhotoCredit(unitId: string) {
  return CREDITS[SQUAD_PHOTO_SOURCE[unitId] ?? 'shnayder'];
}
