import { getAlliedFactions } from '@/lib/faction-allies';

const factions = [
  { id: 'polaris', allies: [] },
  { id: 'protectorate', allies: ['rutenia'] },
  { id: 'rutenia', allies: ['protectorate'] },
  { id: 'mercenaries', allies: ['*'] },
];

describe('getAlliedFactions', () => {
  it('symmetric pair + wildcard: pair allies both ways AND include mercenaries', () => {
    expect(Array.from(getAlliedFactions('protectorate', factions)).sort()).toEqual(['mercenaries', 'rutenia']);
    expect(Array.from(getAlliedFactions('rutenia', factions)).sort()).toEqual(['mercenaries', 'protectorate']);
  });

  it('wildcard allies everyone both ways', () => {
    expect(Array.from(getAlliedFactions('mercenaries', factions)).sort()).toEqual(['polaris', 'protectorate', 'rutenia']);
    expect(getAlliedFactions('polaris', factions).has('mercenaries')).toBe(true);
  });

  it('faction with no allies still gets wildcard allies (mercenaries) but not others', () => {
    expect(Array.from(getAlliedFactions('polaris', factions)).sort()).toEqual(['mercenaries']);
  });

  it('one-side declaration still resolves symmetrically', () => {
    const oneSided = [{ id: 'a', allies: ['b'] }, { id: 'b' }];
    expect(Array.from(getAlliedFactions('b', oneSided))).toEqual(['a']);
    expect(Array.from(getAlliedFactions('a', oneSided))).toEqual(['b']);
  });

  it('excludes self', () => {
    expect(getAlliedFactions('polaris', factions).has('polaris')).toBe(false);
  });

  it('only considers factions present in the passed list', () => {
    const subset = [{ id: 'polaris', allies: [] }, { id: 'mercenaries', allies: ['*'] }];
    expect(Array.from(getAlliedFactions('polaris', subset))).toEqual(['mercenaries']);
  });

  it('undefined allies treated as no allies', () => {
    const noAllies = [{ id: 'a' }, { id: 'b' }];
    expect(getAlliedFactions('a', noAllies).size).toBe(0);
  });
});
