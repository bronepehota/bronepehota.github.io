/**
 * Regression tests for user/painter feedback on encyclopedia attribution &
 * stats (Shnaider + Velian feedback round, 2026-07).
 *
 * 1. Тяжёлая штурмовая пехота Велиана (Star System) — rank was wrongly 3, must be 5.
 * 2. // ИЗОБРАЖЕНИЯ for all lords + advisors + 4 named орудия → Shnaider (was Star System).
 * 3. Лёгкая киберпехота // ПОКРАС → Андрей Суков (was wrongly Shnaider); no logo per author.
 */
import { getSource } from '../lib/sources-registry';
import { getEncyclopediaUnit } from '../lib/encyclopedia-registry';
import { CREDITS, SQUAD_PHOTO_SOURCE, getCredit, getPhotoCredit } from '../lib/painted-images';

const VELIAN = 'protectorate_tyazhyolaya_shturmovaya_pehota_veliana';

describe('Velian heavy infantry — Star System rank (user-verified 3 → 5)', () => {
  const unit = getSource('star_system')!.squads.find(s => s.id === VELIAN);
  it('exists in the Star System source', () => {
    expect(unit).toBeTruthy();
  });
  it('every soldier has rank 5', () => {
    expect(unit!.soldiers.map(s => s.rank)).toEqual([5, 5, 5, 5]);
  });
});

const HERO_IDS = [
  // 6 Polaris lords
  'polaris_markus_trehglazyy', 'polaris_erkkhard', 'polaris_kross',
  'polaris_shindzhi', 'polaris_ledi_agata', 'polaris_dolgorukiy',
  // 6 Protectorate advisors (Круг Советников)
  'protectorate_prizrak', 'protectorate_mark_chang', 'protectorate_piriel',
  'protectorate_elveret', 'protectorate_olgerd', 'protectorate_zheleznyy_general',
];
const ORUDIE_IDS = ['sparennaya_pushka', 'mdb_15', 'buldog', 'minomet'];

describe('Shnaider image attribution — lords, advisors, орудия', () => {
  it.each(HERO_IDS)('%s → imageSource "shnayder"', (id) => {
    expect(getEncyclopediaUnit(id)?.imageSource).toBe('shnayder');
  });
  it.each(ORUDIE_IDS)('%s → imageSource "shnayder"', (id) => {
    expect(getEncyclopediaUnit(id)?.imageSource).toBe('shnayder');
  });
});

describe('Лёгкая киберпехота painter → Андрей Суков', () => {
  it('photo source points to "sukov" (was "shnayder")', () => {
    expect(SQUAD_PHOTO_SOURCE.protectorate_lyogkaya_kiberpehota).toBe('sukov');
  });
  it('sukov credit is registered: name + url, no logo (author has none)', () => {
    expect(CREDITS.sukov).toBeDefined();
    expect(getCredit('sukov')?.name).toBe('Андрей Суков');
    expect(getCredit('sukov')?.url).toBe('https://vk.ru/sukov85');
    expect(getCredit('sukov')?.logo).toBe('');
  });
  it('getPhotoCredit resolves to Суков, not Шнайдер', () => {
    expect(getPhotoCredit('protectorate_lyogkaya_kiberpehota')?.name).toBe('Андрей Суков');
  });
});
