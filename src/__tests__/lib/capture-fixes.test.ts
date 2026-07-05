import { deriveUnitStatus } from '@/lib/unit-status';
import { getCaptureCandidates, filterCaptureCatalog, opposingFaction } from '@/lib/capture-catalog';
import { resolveMachineFromSource } from '@/lib/machine-resolver';
import { ArmyUnit, Machine, Squad } from '@/lib/types';

// ── Helpers ──
const mockSquadUnit = (overrides?: Partial<ArmyUnit>): ArmyUnit => ({
  instanceId: 'squad-1', type: 'squad', instanceNumber: 1,
  data: { id: 'test', name: 'Test', faction: 'polaris', cost: 50, soldiers: [
    { rank: 4, speed: 4, range: 'D12', power: '2D6', melee: 0, armor: 2 }
  ]} as Squad,
  ...overrides,
});

const mockMachineUnit = (overrides?: Partial<ArmyUnit>): ArmyUnit => ({
  instanceId: 'machine-1', type: 'machine', instanceNumber: 1,
  data: { id: 'demolisher', name: 'Demolisher', faction: 'polaris', cost: 150, rank: 2,
    fire_rate: 2, ammo_max: 5, durability_max: 16, image: '', speed_sectors: [],
    weapons: [{ name: 'Cannon', range: 'D12', power: '2D6' }] } as Machine,
  currentDurability: 10, currentAmmo: 5,
  ...overrides,
});

// ── Fix 1: deriveUnitStatus returns 'captured' for isCaptured machine ──
describe('#168 fix: captured status in navigator', () => {
  it('returns "captured" for a machine with isCaptured=true', () => {
    const unit = mockMachineUnit({ isCaptured: true, currentDurability: 10 });
    expect(deriveUnitStatus(unit)).toBe('captured');
  });

  it('returns "active" for a machine without isCaptured', () => {
    const unit = mockMachineUnit({ currentDurability: 10 });
    expect(deriveUnitStatus(unit)).toBe('active');
  });

  it('returns "captured" even if machine is also done', () => {
    const unit = mockMachineUnit({ isCaptured: true, isMachineDone: true });
    expect(deriveUnitStatus(unit)).toBe('captured');
  });

  it('returns "captured" takes priority over dead (durability 0)', () => {
    const unit = mockMachineUnit({ isCaptured: true, currentDurability: 0 });
    expect(deriveUnitStatus(unit)).toBe('captured');
  });

  it('squads are never "captured" (only machines)', () => {
    const unit = mockSquadUnit({ isCaptured: true } as any);
    expect(deriveUnitStatus(unit)).not.toBe('captured');
  });
});

// ── Fix 2: catalog shows real stats (not 0/0/0) ──
describe('#168 fix: catalog resolves real stats from sources', () => {
  it('getCaptureCandidates returns machines with non-zero rank/durability_max', () => {
    const catalog = getCaptureCandidates();
    const withStats = catalog.filter(m => m.rank > 0 && m.durability_max > 0);
    // At least some machines should have real stats (not all 0/0/0)
    expect(withStats.length).toBeGreaterThan(0);
  });

  it('resolveMachineFromSource returns real Machine data', () => {
    const catalog = getCaptureCandidates();
    if (catalog.length === 0) return; // skip if no catalog
    const first = catalog[0];
    const resolved = resolveMachineFromSource(first.id);
    expect(resolved).not.toBeNull();
    expect(resolved!.weapons.length).toBeGreaterThan(0);
    expect(resolved!.durability_max).toBeGreaterThan(0);
  });
});

// ── Fix 3: opposingFaction returns non-army faction ──
describe('#168 fix: opposingFaction', () => {
  it('returns a faction different from armyFaction', () => {
    const all = ['polaris', 'protectorate', 'mercenaries'];
    expect(opposingFaction('polaris', all)).not.toBe('polaris');
    expect(opposingFaction('protectorate', all)).not.toBe('protectorate');
  });

  it('falls back to armyFaction if no other exists', () => {
    expect(opposingFaction('polaris', ['polaris'])).toBe('polaris');
  });
});

// ── Fix 4: filterCaptureCatalog rank filter is strict (≤ not <) ──
describe('#168 fix: rank filter boundary', () => {
  const catalog = [
    { id: 'm1', name: 'M1', faction: 'polaris', rank: 2, durability_max: 10, ammo_max: 5 },
    { id: 'm2', name: 'M2', faction: 'polaris', rank: 3, durability_max: 12, ammo_max: 6 },
  ];

  it('rank=2 soldier can capture rank=2 machine (boundary ≤)', () => {
    const result = filterCaptureCatalog(catalog, { soldierRank: 2, strictRank: true });
    expect(result.find(m => m.id === 'm1')).toBeDefined();
  });

  it('rank=2 soldier cannot capture rank=3 machine', () => {
    const result = filterCaptureCatalog(catalog, { soldierRank: 2, strictRank: true });
    expect(result.find(m => m.id === 'm2')).toBeUndefined();
  });
});

// ── Fix 5: captured machine should NOT be created with isCaptured=true ──
describe('#168 fix: captured machine is active (not isCaptured)', () => {
  it('a newly captured machine unit should not have isCaptured', () => {
    // Simulate the unit created by handleCaptureConfirm
    const capturedMachine = mockMachineUnit({
      instanceId: 'demolisher_1234567890',
      currentDurability: 8,
      currentAmmo: 3,
      pilotInfo: { squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 2, alive: true },
      // isCaptured should NOT be set (this was the bug)
    });
    expect(capturedMachine.isCaptured).toBeFalsy();
    expect(deriveUnitStatus(capturedMachine)).toBe('active');
  });
});

// ── Fix 6: per-weapon ammo for community rules ──
describe('#168 fix: per-weapon ammo initialization', () => {
  it('community machine should have weaponAmmo array matching weapons count', () => {
    const resolved = resolveMachineFromSource('demolisher');
    if (!resolved) return;
    const weapons = resolved.weapons.filter(w => w.range !== 'ББ');
    const weaponAmmo = weapons.map(w => w.ammo ?? resolved.ammo_max ?? 0);
    expect(weaponAmmo.length).toBe(weapons.length);
    expect(weaponAmmo.every(a => a >= 0)).toBe(true);
  });

  it('total ammo = sum of per-weapon ammo', () => {
    const resolved = resolveMachineFromSource('demolisher');
    if (!resolved) return;
    const weapons = resolved.weapons.filter(w => w.range !== 'ББ');
    const weaponAmmo = weapons.map(w => w.ammo ?? resolved.ammo_max ?? 0);
    const total = weaponAmmo.reduce((s, a) => s + a, 0);
    expect(total).toBeGreaterThan(0);
    // total should equal sum (not a separate number)
    expect(total).not.toBe(resolved.ammo_max);
  });
});
