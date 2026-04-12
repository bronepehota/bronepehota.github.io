/**
 * Tests for validation module
 */

import {
  validateDiceNotation,
  validateSquad,
  validateMachine,
  validateSource,
} from '@/lib/editor/validation';
import { CustomSquad, CustomMachine, CustomSource, ValidationWarning } from '@/lib/editor/types';

describe('validateDiceNotation', () => {
  describe('valid notations', () => {
    it('accepts D6', () => {
      const result = validateDiceNotation('D6');
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('accepts D12', () => {
      const result = validateDiceNotation('D12');
      expect(result.valid).toBe(true);
    });

    it('accepts D20', () => {
      const result = validateDiceNotation('D20');
      expect(result.valid).toBe(true);
    });

    it('accepts D6+2', () => {
      const result = validateDiceNotation('D6+2');
      expect(result.valid).toBe(true);
    });

    it('accepts 2D12', () => {
      const result = validateDiceNotation('2D12');
      expect(result.valid).toBe(true);
    });

    it('accepts 3D6+1', () => {
      const result = validateDiceNotation('3D6+1');
      expect(result.valid).toBe(true);
    });

    it('accepts ББ (melee)', () => {
      const result = validateDiceNotation('ББ');
      expect(result.valid).toBe(true);
    });

    it('accepts empty string (no attack)', () => {
      const result = validateDiceNotation('');
      expect(result.valid).toBe(true);
    });

    it('accepts single number (fixed value)', () => {
      const result = validateDiceNotation('5');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid notations', () => {
    it('rejects lowercase d6', () => {
      const result = validateDiceNotation('d6');
      expect(result.valid).toBe(false);
      expect(result.warning).toBeDefined();
    });

    it('rejects D8 (unsupported die)', () => {
      const result = validateDiceNotation('D8');
      expect(result.valid).toBe(false);
      expect(result.warning).toContain('D6, D12, D20');
    });

    it('rejects invalid format', () => {
      const result = validateDiceNotation('invalid');
      expect(result.valid).toBe(false);
    });

    it('rejects D6-1 (negative bonus not allowed)', () => {
      const result = validateDiceNotation('D6-1');
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateSquad', () => {
  const validSquad: CustomSquad = {
    id: 'polaris_custom_test_squad',
    name: 'Test Squad',
    faction: 'polaris',
    cost: 100,
    soldiers: [
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
    ],
  };

  it('validates a correct squad', () => {
    const result = validateSquad(validSquad);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('warns on missing name', () => {
    const result = validateSquad({ ...validSquad, name: '' });
    expect(result.valid).toBe(true); // Warning, not error
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'name')).toBe(true);
  });

  it('warns on zero cost', () => {
    const result = validateSquad({ ...validSquad, cost: 0 });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'cost')).toBe(true);
  });

  it('warns on empty soldiers array', () => {
    const result = validateSquad({ ...validSquad, soldiers: [] });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'soldiers')).toBe(true);
  });

  it('warns on more than 6 soldiers', () => {
    const soldiers = Array(7).fill(validSquad.soldiers[0]);
    const result = validateSquad({ ...validSquad, soldiers });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'soldiers')).toBe(true);
  });

  it('warns on invalid dice notation in range', () => {
    const soldiers = [{ ...validSquad.soldiers[0], range: 'invalid' }];
    const result = validateSquad({ ...validSquad, soldiers });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'soldiers[0].range')).toBe(true);
  });

  it('warns on invalid dice notation in power', () => {
    const soldiers = [{ ...validSquad.soldiers[0], power: 'invalid' }];
    const result = validateSquad({ ...validSquad, soldiers });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'soldiers[0].power')).toBe(true);
  });

  it('warns on negative armor', () => {
    const soldiers = [{ ...validSquad.soldiers[0], armor: -1 }];
    const result = validateSquad({ ...validSquad, soldiers });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'soldiers[0].armor')).toBe(true);
  });

  it('warns on rank > 7', () => {
    const soldiers = [{ ...validSquad.soldiers[0], rank: 8 }];
    const result = validateSquad({ ...validSquad, soldiers });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'soldiers[0].rank')).toBe(true);
  });
});

describe('validateMachine', () => {
  const validMachine: CustomMachine = {
    id: 'polaris_custom_test_tank',
    name: 'Test Tank',
    faction: 'polaris',
    cost: 200,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    weapons: [
      { name: 'Main Gun', range: 'D12', power: '2D20' },
    ],
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 },
    ],
  };

  it('validates a correct machine', () => {
    const result = validateMachine(validMachine);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('warns on missing name', () => {
    const result = validateMachine({ ...validMachine, name: '' });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'name')).toBe(true);
  });

  it('warns on zero cost', () => {
    const result = validateMachine({ ...validMachine, cost: 0 });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'cost')).toBe(true);
  });

  it('warns on empty weapons array', () => {
    const result = validateMachine({ ...validMachine, weapons: [] });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'weapons')).toBe(true);
  });

  it('warns on more than 4 weapons', () => {
    const weapons = Array(5).fill(validMachine.weapons[0]);
    const result = validateMachine({ ...validMachine, weapons });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'weapons')).toBe(true);
  });

  it('warns on invalid dice notation in weapon range', () => {
    const weapons = [{ ...validMachine.weapons[0], range: 'invalid' }];
    const result = validateMachine({ ...validMachine, weapons });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'weapons[0].range')).toBe(true);
  });

  it('warns on invalid dice notation in weapon power', () => {
    const weapons = [{ ...validMachine.weapons[0], power: 'invalid' }];
    const result = validateMachine({ ...validMachine, weapons });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'weapons[0].power')).toBe(true);
  });

  it('warns on incomplete speed_sectors coverage', () => {
    const speed_sectors = [
      { min_durability: 5, max_durability: 16, speed: 2 },
      // Missing 1-4 range
    ];
    const result = validateMachine({ ...validMachine, speed_sectors });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'speed_sectors')).toBe(true);
  });

  it('warns on gaps in speed_sectors', () => {
    const speed_sectors = [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 6, speed: 1 },
      // Gap: 7-8 not covered
    ];
    const result = validateMachine({ ...validMachine, speed_sectors });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'speed_sectors')).toBe(true);
  });

  it('warns on zero durability_max', () => {
    const result = validateMachine({ ...validMachine, durability_max: 0 });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'durability_max')).toBe(true);
  });

  it('warns on zero ammo_max', () => {
    const result = validateMachine({ ...validMachine, ammo_max: 0 });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'ammo_max')).toBe(true);
  });
});

describe('validateSource', () => {
  const validSource: CustomSource = {
    id: 'custom_test123',
    name: 'Test Source',
    description: 'A test source',
    version: '1.0',
    baseSource: null,
    factions: [{ id: 'polaris', name: 'Polaris', color: '#ef4444' }],
    squads: [],
    machines: [],
    createdAt: '2026-03-15T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
  };

  it('validates a correct source', () => {
    const result = validateSource(validSource);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('warns on missing name', () => {
    const result = validateSource({ ...validSource, name: '' });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'name')).toBe(true);
  });

  it('warns on empty factions', () => {
    const result = validateSource({ ...validSource, factions: [] });
    expect(result.warnings.some((w: ValidationWarning) => w.field === 'factions')).toBe(true);
  });

  it('validates squads within source', () => {
    const squads = [{
      id: 'test',
      name: '',
      faction: 'polaris',
      cost: 100,
      soldiers: [],
    }] as CustomSquad[];
    const result = validateSource({ ...validSource, squads });
    expect(result.warnings.some((w: ValidationWarning) => w.field.includes('squads'))).toBe(true);
  });

  it('validates machines within source', () => {
    const machines = [{
      id: 'test',
      name: '',
      faction: 'polaris',
      cost: 100,
      rank: 2,
      fire_rate: 2,
      ammo_max: 20,
      durability_max: 16,
      weapons: [],
      speed_sectors: [],
    }] as CustomMachine[];
    const result = validateSource({ ...validSource, machines });
    expect(result.warnings.some((w: ValidationWarning) => w.field.includes('machines'))).toBe(true);
  });
});
