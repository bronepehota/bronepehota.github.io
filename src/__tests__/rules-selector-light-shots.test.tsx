import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RulesSelector } from '@/components/rules/RulesSelector';
import { getAllRulesVersions } from '@/lib/rules-registry';

describe('RulesSelector — light shots toggle gating (Star System rules only)', () => {
  const baseProps = {
    versions: getAllRulesVersions(),
    onVersionChange: jest.fn(),
  };

  it('renders light shots toggle for community_star_system rules', () => {
    render(
      <RulesSelector
        {...baseProps}
        selectedVersion="community_star_system"
        lightShotsEnabled={false}
        onLightShotsEnabledChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('light-shots-toggle')).toBeInTheDocument();
  });

  it('hides light shots toggle for tehnolog rules', () => {
    render(
      <RulesSelector
        {...baseProps}
        selectedVersion="tehnolog"
        lightShotsEnabled={false}
        onLightShotsEnabledChange={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('light-shots-toggle')).not.toBeInTheDocument();
  });

  it('hides toggle when no handler passed (opt-in prop)', () => {
    render(
      <RulesSelector
        {...baseProps}
        selectedVersion="community_star_system"
      />,
    );

    expect(screen.queryByTestId('light-shots-toggle')).not.toBeInTheDocument();
  });
});
