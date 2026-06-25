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
});
