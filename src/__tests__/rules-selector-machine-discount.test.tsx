import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RulesSelector } from '@/components/rules/RulesSelector';
import { getAllRulesVersions } from '@/lib/rules-registry';

describe('RulesSelector — machine discount toggle gating (Star System rules only)', () => {
  const baseProps = {
    versions: getAllRulesVersions(),
    onVersionChange: jest.fn(),
  };

  it('renders machine discount toggle for community_star_system rules', () => {
    render(
      <RulesSelector
        {...baseProps}
        selectedVersion="community_star_system"
        machineDiscountEnabled={false}
        onMachineDiscountEnabledChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('machine-discount-toggle')).toBeInTheDocument();
  });

  it('hides machine discount toggle for tehnolog rules', () => {
    render(
      <RulesSelector
        {...baseProps}
        selectedVersion="tehnolog"
        machineDiscountEnabled={false}
        onMachineDiscountEnabledChange={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('machine-discount-toggle')).not.toBeInTheDocument();
  });

  it('hides toggle when no handler passed (opt-in prop)', () => {
    render(
      <RulesSelector
        {...baseProps}
        selectedVersion="community_star_system"
      />,
    );

    expect(screen.queryByTestId('machine-discount-toggle')).not.toBeInTheDocument();
  });
});
