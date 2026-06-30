import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatResults } from '@/components/combat/CombatResults';
import { CombatResult, CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';

// Mock AnimatedDice to simplify testing
jest.mock('@/components/combat/AnimatedDice', () => ({
  AnimatedDice: ({ value, color, isHit, bonus, className }: any) => (
    <div data-testid="animated-dice" data-value={value} data-color={color} data-ishit={isHit} data-bonus={bonus} className={className}>
      D{value}
    </div>
  ),
}));

describe('CombatResults - Grenade Display', () => {
  const mockParameters: CombatParameters = {
    distance: 5,
    targetArmor: 2,
    targetMelee: 2,
    fortification: 'none',
    isSurpriseAttack: false,
    isAimedShot: false,
  };

  const mockGrenadeResult: CombatResult = {
    actionType: 'grenade',
    unitType: 'squad',
    parameters: mockParameters,
    hitResult: {
      success: true,
      roll: 4,
      total: 4,
      bonus: 0,
      isGrenade: true,
    },
    timestamp: Date.now(),
    unitName: 'Test Squad',
    unitId: 'test-squad-1',
    soldierIndex: 0,
    grenadeDistance: 4,
    grenadeBlastZone: {
      minSteps: 3,
      maxSteps: 5,
      minCm: 12,
      maxCm: 20,
    },
    grenadeBlastChecks: [],
  };

  const defaultProps = {
    result: mockGrenadeResult,
    parameters: mockParameters,
    rulesVersion: 'tehnolog' as RulesVersionID,
    onApply: jest.fn(),
    onGoBack: jest.fn(),
    unitType: 'squad' as const,
    onGrenadeCheckTarget: jest.fn(),
    autoCompleteEnabled: false,
  };

  describe('Tehnolog rules (single dice, no bonus)', () => {
    it('should display single D6 dice', () => {
      render(<CombatResults {...defaultProps} rulesVersion="tehnolog" />);

      const dice = screen.getByTestId('animated-dice');
      expect(dice).toBeInTheDocument();
      expect(dice).toHaveAttribute('data-value', '4');
      expect(dice).toHaveAttribute('data-bonus', '0');
    });

    it('should not display rank bonus', () => {
      render(<CombatResults {...defaultProps} rulesVersion="tehnolog" />);

      const dice = screen.getByTestId('animated-dice');
      // Bonus should be 0 for tehnolog rules
      expect(dice).toHaveAttribute('data-bonus', '0');
    });

    it('should display blast zone correctly', () => {
      render(<CombatResults {...defaultProps} rulesVersion="tehnolog" />);

      expect(screen.getByText('Зона взрыва')).toBeInTheDocument();
      expect(screen.getByText('3-5')).toBeInTheDocument(); // minSteps-maxSteps
      expect(screen.getByText('[12-20 см]')).toBeInTheDocument(); // minCm-maxCm
    });

    it('should show danger warning when roll is 1', () => {
      const dangerResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 1,
          total: 1,
          bonus: 0,
          isGrenade: true,
        },
        grenadeDistance: 1,
        grenadeBlastZone: {
          minSteps: 1,
          maxSteps: 2,
          minCm: 4,
          maxCm: 8,
        },
      };

      render(<CombatResults {...defaultProps} result={dangerResult} rulesVersion="tehnolog" />);

      expect(screen.getByText('Опасно! Вы в зоне взрыва!')).toBeInTheDocument();
      expect(screen.getByText('ОПАСНО')).toBeInTheDocument();
    });

    it('should show explosion label when roll is not 1', () => {
      render(<CombatResults {...defaultProps} rulesVersion="tehnolog" />);

      // The label shows either 'ОПАСНО' or 'ВЗРЫВ' depending on roll
      // Use getAllByText since there might be multiple "ВЗРЫВ" elements
      const explosionLabels = screen.getAllByText('ВЗРЫВ');
      expect(explosionLabels.length).toBeGreaterThan(0);

      // Should NOT show danger label
      expect(screen.queryByText('ОПАСНО')).not.toBeInTheDocument();
    });
  });

  describe('Community Star System rules (multiple rolls, best highlighted)', () => {
    it('should display multiple dice when rolls array has multiple values', () => {
      const multipleRollsResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 5, // Best roll
          total: 5,
          bonus: 0,
          rolls: [2, 5, 3, 1, 4], // 5 rolls for rank 5
          isGrenade: true,
        },
        grenadeDistance: 5,
      };

      render(<CombatResults {...defaultProps} result={multipleRollsResult} rulesVersion="community_star_system" />);

      // Should have 5 dice elements
      const diceElements = screen.getAllByTestId('animated-dice');
      expect(diceElements).toHaveLength(5);

      // Check values
      expect(diceElements[0]).toHaveAttribute('data-value', '2');
      expect(diceElements[1]).toHaveAttribute('data-value', '5');
      expect(diceElements[2]).toHaveAttribute('data-value', '3');
      expect(diceElements[3]).toHaveAttribute('data-value', '1');
      expect(diceElements[4]).toHaveAttribute('data-value', '4');
    });

    it('should highlight best roll with emerald color', () => {
      const multipleRollsResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 6, // Best roll
          total: 6,
          bonus: 0,
          rolls: [2, 6, 3, 1, 4], // 5 rolls
          isGrenade: true,
        },
        grenadeDistance: 6,
      };

      render(<CombatResults {...defaultProps} result={multipleRollsResult} rulesVersion="community_star_system" />);

      const diceElements = screen.getAllByTestId('animated-dice');

      // Best roll (6) should be highlighted (isHit=true, emerald color)
      const bestDice = diceElements.find(d => d.getAttribute('data-value') === '6');
      expect(bestDice).toHaveAttribute('data-ishit', 'true');

      // Other rolls should not be highlighted
      const otherDice = diceElements.filter(d => d.getAttribute('data-value') !== '6');
      otherDice.forEach(dice => {
        expect(dice).toHaveAttribute('data-ishit', 'false');
      });
    });

    it('should apply opacity to non-best rolls', () => {
      const multipleRollsResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 5,
          total: 5,
          bonus: 0,
          rolls: [2, 5, 3],
          isGrenade: true,
        },
        grenadeDistance: 5,
      };

      render(<CombatResults {...defaultProps} result={multipleRollsResult} rulesVersion="community_star_system" />);

      const diceElements = screen.getAllByTestId('animated-dice');

      // Non-best dice should have opacity class
      const nonBestDice = diceElements.filter(d => d.getAttribute('data-value') !== '5');
      nonBestDice.forEach(dice => {
        expect(dice).toHaveClass('opacity-40');
      });

      // Best dice should not have opacity class
      const bestDice = diceElements.find(d => d.getAttribute('data-value') === '5');
      expect(bestDice).not.toHaveClass('opacity-40');
    });

    it('should display single dice when only one roll', () => {
      const singleRollResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 4,
          total: 4,
          bonus: 0,
          rolls: [4],
          isGrenade: true,
        },
        grenadeDistance: 4,
      };

      render(<CombatResults {...defaultProps} result={singleRollResult} rulesVersion="community_star_system" />);

      const diceElements = screen.getAllByTestId('animated-dice');
      expect(diceElements).toHaveLength(1);
      expect(diceElements[0]).toHaveAttribute('data-value', '4');
      expect(diceElements[0]).toHaveAttribute('data-bonus', '0');
    });

    it('should not display rank bonus for community_star_system', () => {
      const multipleRollsResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 5,
          total: 5,
          bonus: 0,
          rolls: [2, 5, 3],
          isGrenade: true,
        },
        grenadeDistance: 5,
        soldierRank: 3, // Rank 3 = 3 rolls
      };

      render(<CombatResults {...defaultProps} result={multipleRollsResult} rulesVersion="community_star_system" />);

      // For multiple rolls, AnimatedDice doesn't receive bonus prop at all
      // So data-bonus attribute should be undefined or not present
      const diceElements = screen.getAllByTestId('animated-dice');
      expect(diceElements).toHaveLength(3);

      // None of the dice should have a non-zero bonus
      diceElements.forEach(dice => {
        const bonus = dice.getAttribute('data-bonus');
        // Bonus is either '0', undefined, or null
        expect(bonus === '0' || bonus === null || bonus === undefined).toBe(true);
      });
    });
  });

  describe('Grenade blast checks', () => {
    it('should display blast checks when present', () => {
      const resultWithChecks: CombatResult = {
        ...mockGrenadeResult,
        grenadeBlastChecks: [
          { armor: 2, roll: 15, hit: true },
          { armor: 3, roll: 8, hit: false },
        ],
      };

      render(<CombatResults {...defaultProps} result={resultWithChecks} />);

      expect(screen.getByTestId('grenade-blast-checks')).toBeInTheDocument();
    });

    it('should not display blast checks when empty', () => {
      render(<CombatResults {...defaultProps} />);

      expect(screen.queryByTestId('grenade-blast-checks')).not.toBeInTheDocument();
    });

    it('should call onGrenadeCheckTarget when checking target', async () => {
      const onGrenadeCheckTarget = jest.fn();
      render(
        <CombatResults
          {...defaultProps}
          onGrenadeCheckTarget={onGrenadeCheckTarget}
        />
      );

      // Find the explode button using data-testid
      const explodeButton = screen.getByTestId('grenade-explode-button');
      expect(explodeButton).toBeInTheDocument();

      await userEvent.click(explodeButton);

      // Default armor is 2
      expect(onGrenadeCheckTarget).toHaveBeenCalledWith(2);
    });

    it('should render a "ЦЕЛЬ N" label and testid for each blast check', () => {
      const resultWithChecks: CombatResult = {
        ...mockGrenadeResult,
        grenadeBlastChecks: [
          { armor: 2, roll: 15, hit: true },
          { armor: 3, roll: 8, hit: false },
          { armor: 2, roll: 20, hit: true },
        ],
      };

      render(<CombatResults {...defaultProps} result={resultWithChecks} />);

      const checks = screen.getAllByTestId('grenade-blast-check');
      expect(checks).toHaveLength(3);

      expect(screen.getByText('ЦЕЛЬ 1')).toBeInTheDocument();
      expect(screen.getByText('ЦЕЛЬ 2')).toBeInTheDocument();
      expect(screen.getByText('ЦЕЛЬ 3')).toBeInTheDocument();
    });

    it('should highlight only the newest (last) blast check with a ring', () => {
      const resultWithChecks: CombatResult = {
        ...mockGrenadeResult,
        grenadeBlastChecks: [
          { armor: 2, roll: 15, hit: true },
          { armor: 3, roll: 8, hit: false },
        ],
      };

      render(<CombatResults {...defaultProps} result={resultWithChecks} />);

      const checks = screen.getAllByTestId('grenade-blast-check');
      expect(checks[1]).toHaveClass('ring-2');
      expect(checks[0]).not.toHaveClass('ring-2');
    });
  });

  describe('Grenade distance calculation', () => {
    it('should calculate correct blast zone for distance 4', () => {
      render(<CombatResults {...defaultProps} />);

      // Distance 4 → blast zone 3-5 steps, 12-20 cm
      expect(screen.getByText('3-5')).toBeInTheDocument();
      expect(screen.getByText('[12-20 см]')).toBeInTheDocument();
    });

    it('should handle distance 1 correctly', () => {
      const distance1Result: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 1,
          total: 1,
          bonus: 0,
          isGrenade: true,
        },
        grenadeDistance: 1,
        grenadeBlastZone: {
          minSteps: 1,
          maxSteps: 2,
          minCm: 4,
          maxCm: 8,
        },
      };

      render(<CombatResults {...defaultProps} result={distance1Result} />);

      // Distance 1 → blast zone 1-2 steps (min is 1), 4-8 cm
      expect(screen.getByText('1-2')).toBeInTheDocument();
      expect(screen.getByText('[4-8 см]')).toBeInTheDocument();
    });

    it('should handle high distance values', () => {
      const highDistanceResult: CombatResult = {
        ...mockGrenadeResult,
        hitResult: {
          success: true,
          roll: 6,
          total: 6,
          bonus: 0,
          isGrenade: true,
        },
        grenadeDistance: 6,
        grenadeBlastZone: {
          minSteps: 5,
          maxSteps: 7,
          minCm: 20,
          maxCm: 28,
        },
      };

      render(<CombatResults {...defaultProps} result={highDistanceResult} />);

      expect(screen.getByText('5-7')).toBeInTheDocument();
      expect(screen.getByText('[20-28 см]')).toBeInTheDocument();
    });
  });
});
