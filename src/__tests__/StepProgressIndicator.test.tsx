import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepProgressIndicator } from '@/components/rules/StepProgressIndicator';

describe('StepProgressIndicator', () => {
  describe('5th step support', () => {
    it('should accept "preparation" as a valid currentStep value', () => {
      // This test verifies the component accepts 'preparation' as currentStep
      // Before the fix, TypeScript would error and runtime might fail
      expect(() => {
        render(
          <StepProgressIndicator
            currentStep="preparation"
            selectedFaction="polaris"
          />
        );
      }).not.toThrow();
    });

    it('should have 5 steps in total', () => {
      render(
        <StepProgressIndicator
          currentStep="faction"
          selectedFaction="polaris"
        />
      );

      // Should have 5 step buttons
      const steps = screen.getAllByRole('button');
      expect(steps).toHaveLength(5);
    });

    it('should display 5th step as "Расстановка" with Sword icon', () => {
      render(
        <StepProgressIndicator
          currentStep="preparation"
          selectedFaction="polaris"
        />
      );

      // The 5th step should be active and have label "Расстановка"
      const activeStep = screen.getByRole('button', { current: 'step' });
      expect(activeStep).toBeInTheDocument();

      // Check the aria-label contains "Расстановка"
      expect(activeStep).toHaveAttribute('aria-label', expect.stringContaining('Расстановка'));
    });

    it('should map "preparation" step to index 4', () => {
      const { container } = render(
        <StepProgressIndicator
          currentStep="preparation"
          selectedFaction="polaris"
        />
      );

      // The active step should be the 5th one (index 4)
      const buttons = container.querySelectorAll('button[aria-current="step"]');
      expect(buttons).toHaveLength(1);

      // All previous steps should be marked as completed
      const completedSteps = screen.getAllByRole('button', { current: undefined });
      const completedWithCheckmarks = completedSteps.filter(btn =>
        btn.querySelector('svg[class*="text-green-400"]') || btn.textContent?.includes('')
      );
      expect(completedWithCheckmarks.length).toBeGreaterThanOrEqual(4);
    });

    it('should mark all steps as completed when on preparation step', () => {
      render(
        <StepProgressIndicator
          currentStep="preparation"
          selectedFaction="polaris"
        />
      );

      // First 4 steps should show checkmarks (green)
      const buttons = screen.getAllByRole('button');
      const checkmarkButtons = buttons.filter(btn =>
        btn.innerHTML.includes('Check') || btn.className.includes('text-green-400')
      );

      expect(checkmarkButtons).toHaveLength(4);
    });
  });

  describe('existing 4-step functionality', () => {
    it('should work with original 4 steps', () => {
      render(
        <StepProgressIndicator
          currentStep="units"
          selectedFaction="polaris"
        />
      );

      const steps = screen.getAllByRole('button');
      expect(steps).toHaveLength(5); // Now 5 total
    });
  });
});
