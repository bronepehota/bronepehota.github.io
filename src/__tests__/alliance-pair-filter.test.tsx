/**
 * Pair-alliance filter test for <UnitSelector>.
 *
 * The alliance model in src/lib/faction-allies.ts is symmetric + wildcard:
 *   protectorate ⇄ rutenia (declared pair),  mercenaries ⇄ everyone (wildcard).
 * <UnitSelector>'s `isAvailable` keeps a unit when its faction equals the
 * selected faction OR is in `alliedFactionIds`. With `selectedFaction="protectorate"`
 * and `alliedFactionIds=new Set(['rutenia'])`, a polaris squad must be filtered
 * out (not own, not allied) while a rutenia squad must render. This guards
 * against regressing back to the old hardcoded `mercenaries` special-case.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitSelector } from '@/components/UnitSelector';
import type { Faction, Squad, FactionID } from '@/lib/types';

const factions: Faction[] = [
  { id: 'polaris', name: 'Polaris', color: '#ef4444', description: '', motto: '', homeWorld: '' },
  { id: 'protectorate', name: 'Протекторат', color: '#06b6d4', description: '', motto: '', homeWorld: '' },
  { id: 'rutenia', name: 'Рутения', color: '#ea580c', description: '', motto: '', homeWorld: '' },
];

const polarisSquad: Squad = {
  id: 'polaris_pair_filter_test',
  name: 'Полярис Тест',
  faction: 'polaris' as FactionID,
  cost: 50,
  soldiers: [],
  image: '/images/polaris-test.png',
};

const ruteniaSquad: Squad = {
  id: 'rutenia_pair_filter_test',
  name: 'Рутения Тест',
  faction: 'rutenia' as FactionID,
  cost: 50,
  soldiers: [],
  image: '/images/rutenia-test.png',
};

describe('UnitSelector alliance pair filter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders allied-faction squad and hides non-allied non-own faction squad', () => {
    render(
      <UnitSelector
        factions={factions}
        squads={[polarisSquad, ruteniaSquad]}
        machines={[]}
        selectedFaction="protectorate"
        alliedFactionIds={new Set<FactionID>(['rutenia'])}
        pointBudget={500}
        army={[]}
        onAddUnit={jest.fn()}
        onRemoveUnit={jest.fn()}
        onToBattle={jest.fn()}
        displayMode="detailed"
        onDisplayModeChange={jest.fn()}
        sourceId="star_system"
      />,
    );

    // Allied (rutenia) squad renders — name is uppercased by UnitSelector.
    expect(screen.getByText('РУТЕНИЯ ТЕСТ')).toBeVisible();
    // Non-allied, non-own (polaris) squad is filtered out.
    expect(screen.queryByText('ПОЛЯРИС ТЕСТ')).not.toBeInTheDocument();
  });
});
