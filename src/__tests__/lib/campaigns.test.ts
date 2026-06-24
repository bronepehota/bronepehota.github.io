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
});
