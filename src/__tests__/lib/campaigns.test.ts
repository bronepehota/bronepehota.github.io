import { getAllCampaigns } from '@/lib/campaigns';

describe('campaigns loader', () => {
  it('discovers the Корпоративные войны campaign', () => {
    const all = getAllCampaigns();
    expect(all.length).toBeGreaterThan(0);
    const hv2 = all.find((c) => c.slug === 'korporativnye-voyny');
    expect(hv2).toBeDefined();
    expect(hv2!.title).toBe('Корпоративные войны');
  });

  it('parses units and missions frontmatter', () => {
    const hv2 = getAllCampaigns().find((c) => c.slug === 'korporativnye-voyny')!;
    expect(hv2.units?.length).toBeGreaterThan(0);
    expect(
      hv2.units?.some((u) => u.id === 'protectorate_tyazhyolaya_shturmovaya_pehota_veliana')
    ).toBe(true);
    expect(hv2.missions?.length).toBe(4);
  });

  it('sorts campaigns by order', () => {
    const all = getAllCampaigns();
    expect(all[0].slug).toBe('korporativnye-voyny');
  });

  it('discovers the Скрытый враг chronicle', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'skrytyj-vrag');
    expect(sv).toBeDefined();
    expect(sv!.title).toBe('Операция «Скрытый враг»');
  });

  it('Скрытый враг has a units roster and a mission', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'skrytyj-vrag')!;
    expect(sv.units?.length).toBeGreaterThan(0);
    expect(
      sv.units?.some((u) => u.id === 'mercenaries_piraty_markusa_novye')
    ).toBe(true);
    expect(sv.missions?.length).toBe(1);
  });

  it('discovers the Штурм Велиана chronicle (роман V.Chertischev — не-Технолог канон)', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana');
    expect(sv).toBeDefined();
    expect(sv!.title).toBe('Штурм Велиана');
    expect(sv!.era).toBe('4527–4528');
    // The battle pitted both superpowers against each other.
    expect(sv!.factions).toEqual(expect.arrayContaining(['protectorate', 'polaris']));
  });

  it('Штурм Велиана rosters real machines and Велиан units', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana')!;
    expect(sv.units?.length).toBeGreaterThan(0);
    // Holder's «Предатор», the recon «Саламандра», and the dual-side «Раптор».
    expect(sv.units?.some((u) => u.id === 'predator')).toBe(true);
    expect(sv.units?.some((u) => u.id === 'salamander')).toBe(true);
    expect(sv.units?.some((u) => u.id === 'raptor')).toBe(true);
    // Советник Ольгерд and Велиан defenders.
    expect(sv.units?.some((u) => u.id === 'protectorate_olgerd')).toBe(true);
    expect(sv.units?.some((u) => u.id === 'protectorate_regulyary_planety_velian')).toBe(true);
  });

  it('включает кампанию «Имперские войны» — самая ранняя эра, order 4', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'imperatorskie-voyny');
    expect(c).toBeDefined();
    expect(c?.order).toBe(4);
    expect(c?.factions).toContain('polaris');
    // Newest era first: korporativnye (1), skrytyj (2), shturm-velyana (3) — this one is 4th.
    expect(all[3]?.slug).toBe('imperatorskie-voyny');
    // Roster carries the war's signature machines.
    expect(c?.units?.some((u) => u.id === 'raptor')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'bronekhod')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'mercenaries_kosari')).toBe(true);
  });

  it('Штурм Велиана несёт кредит романа V.Chertischev (независимый автор — avb)', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana')!;
    expect(sv.loreAuthor).toBe('avb');
    expect(sv.credit?.author).toBe('V.Chertischev');
    expect(sv.credit?.work).toBe('Битва за Велиан');
    expect(sv.credit?.year).toBe(2022);
  });

  it('Имперские войны несут кредит романа V.Chertischev — без года (не указан в издании)', () => {
    const iv = getAllCampaigns().find((c) => c.slug === 'imperatorskie-voyny')!;
    expect(iv.loreAuthor).toBe('avb');
    expect(iv.credit?.author).toBe('V.Chertischev');
    expect(iv.credit?.work).toBe('Имперские войны');
    expect(iv.credit?.year).toBeUndefined();
  });

  it('кампании без установленного источника не выдумывают атрибуцию', () => {
    for (const slug of ['korporativnye-voyny', 'skrytyj-vrag']) {
      const c = getAllCampaigns().find((x) => x.slug === slug)!;
      expect(c.loreAuthor).toBeUndefined();
      expect(c.credit).toBeUndefined();
    }
  });
});
