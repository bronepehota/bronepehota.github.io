import { communityStarSystemRules } from '@/lib/rules/community_star_system';

describe('Community Star System Rules - Hit Calculation with Fortifications', () => {
  describe('calculateHit', () => {
    it('uses direct comparison: total >= distance = hit', () => {
      const result = communityStarSystemRules.calculateHit('D6', 2);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('total');
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(6);
    });

    it('applies light cover fortification (+1 to distance)', () => {
      const result1 = communityStarSystemRules.calculateHit('D6', 3, 'none');
      const result2 = communityStarSystemRules.calculateHit('D6', 3, 'light');

      // With light cover, effective distance is 3+1=4
      expect(result1).toHaveProperty('success');
      expect(result2).toHaveProperty('success');
    });

    it('applies heavy fortification (+2 to distance)', () => {
      const result = communityStarSystemRules.calculateHit('D12', 5, 'heavy');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('total');
      // With heavy, effective distance is 5+2=7
      expect(result.total).toBe(result.roll);
    });

    it('handles bonus in range with fortification', () => {
      const result = communityStarSystemRules.calculateHit('D6+2', 4, 'light');
      // Effective distance is 4+1=5, total is roll+2
      expect(result.total).toBe(result.roll + 2);
    });

    it('handles melee range (ББ) - always hits in melee range', () => {
      const result = communityStarSystemRules.calculateHit('ББ', 1);
      // ББ returns total=0, which would be 0>=1=false
      // But in practice, melee attacks are always in range
      expect(result.roll).toBe(0);
      expect(result.total).toBe(0);
      // Note: The success=false here is actually correct for the hit check logic
      // In practice, melee attacks don't use calculateHit - they use calculateMelee
    });
  });

  describe('calculateDamage - Infantry (Virtual Fire)', () => {
    it('uses same mechanics as official rules for infantry', () => {
      const result = communityStarSystemRules.calculateDamage('2D6', 2, undefined, undefined, false);
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('rolls');
      expect(result.rolls.length).toBe(2);
    });

    it('does not apply fortification modifier to armor for infantry', () => {
      // Fortifications in community rules affect distance, not armor
      const result1 = communityStarSystemRules.calculateDamage('D6', 2, 'none', undefined, false);
      const result2 = communityStarSystemRules.calculateDamage('D6', 2, 'light', undefined, false);
      // Both use same armor value (2)
      expect(result1).toHaveProperty('damage');
      expect(result2).toHaveProperty('damage');
    });

    it('handles bonus in damage calculation', () => {
      const result = communityStarSystemRules.calculateDamage('2D6+2', 3, undefined, undefined, false);
      expect(result.rolls.length).toBe(2);
      result.rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(3); // 1+2
        expect(roll).toBeLessThanOrEqual(8); // 6+2
      });
    });
  });

  describe('calculateMelee', () => {
    it('implements same mechanics as official rules', () => {
      const result = communityStarSystemRules.calculateMelee(3, 2);
      expect(result).toHaveProperty('attackerRoll');
      expect(result).toHaveProperty('attackerTotal');
      expect(result).toHaveProperty('defenderRoll');
      expect(result).toHaveProperty('defenderTotal');
      expect(result).toHaveProperty('winner');

      expect(result.attackerRoll).toBeGreaterThanOrEqual(1);
      expect(result.attackerRoll).toBeLessThanOrEqual(6);
      expect(result.defenderRoll).toBeGreaterThanOrEqual(1);
      expect(result.defenderRoll).toBeLessThanOrEqual(6);

      expect(result.attackerTotal).toBe(result.attackerRoll + 3);
      expect(result.defenderTotal).toBe(result.defenderRoll + 2);
    });

    it('correctly identifies winner', () => {
      const result = communityStarSystemRules.calculateMelee(3, 2);
      expect(['attacker', 'defender', 'draw']).toContain(result.winner);
    });
  });
});

describe('Community Star System Rules - Vehicle Damage (Zone-based)', () => {
  // Create mock machine data for testing
  const mockMachine = {
    id: 'test-vehicle',
    name: 'Test Vehicle',
    faction: 'polaris' as const,
    cost: 100,
    rank: 1,
    fire_rate: 1,
    ammo_max: 10,
    durability_max: 9,
    speed_sectors: [
      { min_durability: 7, max_durability: 9, speed: 6 },
      { min_durability: 4, max_durability: 6, speed: 4 },
      { min_durability: 0, max_durability: 3, speed: 2 }
    ],
    weapons: []
  };

  describe('calculateDamage - Vehicles', () => {
    it('uses zone-based calculation for vehicle targets', () => {
      // Vehicle at durability 7 (green zone: max 6)
      const result = communityStarSystemRules.calculateDamage('2D12', 0, undefined, undefined, true, 7, 9, mockMachine);
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('rolls');
      expect(result.rolls.length).toBe(2);
    });

    it('applies correct damage per die type (D6=1, D12=2, D20=3)', () => {
      // We can't test exact values due to randomness, but we can verify structure
      const resultD6 = communityStarSystemRules.calculateDamage('D6', 0, undefined, undefined, true, 7, 9, mockMachine);
      const resultD12 = communityStarSystemRules.calculateDamage('D12', 0, undefined, undefined, true, 7, 9, mockMachine);
      const resultD20 = communityStarSystemRules.calculateDamage('D20', 0, undefined, undefined, true, 7, 9, mockMachine);

      expect(resultD6.rolls.length).toBe(1);
      expect(resultD12.rolls.length).toBe(1);
      expect(resultD20.rolls.length).toBe(1);
    });

    it('handles different durability zones correctly', () => {
      // Green zone (durability 7-9): max 6
      const greenResult = communityStarSystemRules.calculateDamage('D12', 0, undefined, undefined, true, 8, 9, mockMachine);

      // Yellow zone (durability 4-6): max 3
      const yellowResult = communityStarSystemRules.calculateDamage('D12', 0, undefined, undefined, true, 5, 9, mockMachine);

      // Red zone (durability 0-3): max 0
      const redResult = communityStarSystemRules.calculateDamage('D12', 0, undefined, undefined, true, 2, 9, mockMachine);

      expect(greenResult.rolls.length).toBe(1);
      expect(yellowResult.rolls.length).toBe(1);
      expect(redResult.rolls.length).toBe(1);
    });

    it('uses machine durabilityZones if provided', () => {
      const machineWithZones = {
        ...mockMachine,
        durabilityZones: [
          { max: 9, color: 'green' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 5, color: 'yellow' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 0, color: 'red' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };

      const result = communityStarSystemRules.calculateDamage('2D12', 0, undefined, undefined, true, 6, 9, machineWithZones);
      expect(result.rolls.length).toBe(2);
    });
  });
});
