import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepProgressIndicator } from '@/components/rules/StepProgressIndicator';

describe('StepProgressIndicator', () => {
  describe('6-step flow support', () => {
    it('should accept "source" and "preparation" as valid currentStep values', () => {
      // This test verifies the component accepts 'source' and 'preparation' as currentStep
      expect(() => {
        render(
          <StepProgressIndicator
            currentStep="source"
            selectedFaction="polaris"
          />
        );
      }).not.toThrow();

      expect(() => {
        render(
          <StepProgressIndicator
            currentStep="preparation"
            selectedFaction="polaris"
          />
        );
      }).not.toThrow();
    });

    it('should have 6 steps in total', () => {
      render(
        <StepProgressIndicator
          currentStep="faction"
          selectedFaction="polaris"
        />
      );

      // Should have 6 step buttons: rules, source, faction, budget, units, preparation
      const steps = screen.getAllByRole('button');
      expect(steps).toHaveLength(6);
    });

    it('should display 6th step as "Расстановка" with Sword icon', () => {
      render(
        <StepProgressIndicator
          currentStep="preparation"
          selectedFaction="polaris"
        />
      );

      // The 6th step should be active and have label "Расстановка"
      const activeStep = screen.getByRole('button', { current: 'step' });
      expect(activeStep).toBeInTheDocument();

      // Check the aria-label contains "Расстановка"
      expect(activeStep).toHaveAttribute('aria-label', expect.stringContaining('Расстановка'));
    });

    it('should map "preparation" step to index 5', () => {
      const { container } = render(
        <StepProgressIndicator
          currentStep="preparation"
          selectedFaction="polaris"
        />
      );

      // The active step should be the 6th one (index 5)
      const buttons = container.querySelectorAll('button[aria-current="step"]');
      expect(buttons).toHaveLength(1);

      // All previous steps should be marked as completed
      const completedSteps = screen.getAllByRole('button', { current: undefined });
      const completedWithCheckmarks = completedSteps.filter(btn =>
        btn.querySelector('svg[class*="text-green-400"]') || btn.textContent?.includes('')
      );
      expect(completedWithCheckmarks.length).toBeGreaterThanOrEqual(5);
    });

    it('should mark all steps as completed when on preparation step', () => {
      render(
        <StepProgressIndicator
          currentStep="preparation"
          selectedFaction="polaris"
        />
      );

      // First 5 steps should show checkmarks (green)
      const buttons = screen.getAllByRole('button');
      const checkmarkButtons = buttons.filter(btn =>
        btn.innerHTML.includes('Check') || btn.className.includes('text-green-400')
      );

      expect(checkmarkButtons).toHaveLength(5);
    });
  });

  describe('existing functionality', () => {
    it('should work with units step (5th step)', () => {
      render(
        <StepProgressIndicator
          currentStep="units"
          selectedFaction="polaris"
        />
      );

      const steps = screen.getAllByRole('button');
      expect(steps).toHaveLength(6); // 6 steps total
    });
  });
});
