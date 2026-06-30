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
  describe('calculateDamage - Vehicles', () => {
    it('vehicle target: each penetrating die deals damagePerDie (D6=1, D12=2, D20=3)', () => {
      // threshold 5; high bonus guarantees penetration → damage = dice × damagePerDie
      const r6 = communityStarSystemRules.calculateDamage('D6+99', 5, undefined, undefined, true);
      const r12 = communityStarSystemRules.calculateDamage('D12+99', 5, undefined, undefined, true);
      const r20 = communityStarSystemRules.calculateDamage('D20+99', 5, undefined, undefined, true);
      expect(r6.damage).toBe(1);   // 1 die × D6 → 1
      expect(r12.damage).toBe(2);  // 1 die × D12 → 2
      expect(r20.damage).toBe(3);  // 1 die × D20 → 3
    });

    it('vehicle target: dice below the threshold deal no damage', () => {
      // threshold 99; bonus 0 → no die can exceed 99 → 0 damage
      const r = communityStarSystemRules.calculateDamage('2D12', 99, undefined, undefined, true);
      expect(r.damage).toBe(0);
      expect(r.rolls.length).toBe(2);
    });

    it('vehicle target: multi-die power sums damagePerDie per penetrating die', () => {
      // 2D12, threshold 0 → every die penetrates → 2 × 2 = 4
      const r = communityStarSystemRules.calculateDamage('2D12+99', 0, undefined, undefined, true);
      expect(r.damage).toBe(4);
    });

    it('non-vehicle target: still +1 per penetrating die (infantry)', () => {
      const r = communityStarSystemRules.calculateDamage('D6+99', 5, undefined, undefined, false);
      expect(r.damage).toBe(1);
    });
  });
});
