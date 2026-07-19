import { describe, it, expect } from '@jest/globals';
import { buildMissionArmy } from '@/lib/mission-army';
import type { Mission, MissionParticipant } from '@/lib/mission-types';
import type { Squad, Machine, FactionID } from '@/lib/types';

/**
 * buildMissionArmy turns a mission's per-faction `participants` list into the
 * runtime ArmyUnit[] that pre-fills the player's army when they pick a scenario.
 * This spec pins down the three contracts the caller relies on:
 *   (a) a participant whose `unitId` matches one of the supplied squads/machines
 *       produces an ArmyUnit of the right type, with cost summed into totalCost;
 *   (b) participants with no `unitId` (e.g. a pilot) or an unknown `unitId`
 *       are skipped silently (the mission reference panel still shows their
 *       name, but they don't contribute to the auto-fill);
 *   (c) `count > 1` produces that many instances, each with an incrementing
 *       `instanceNumber` so they're distinguishable in the navigator.
 */

const ruteniaSquad: Squad = {
  id: 'rutenia_test_squad',
  name: 'Тестовый отряд',
  faction: 'rutenia' as FactionID,
  cost: 50,
  soldiers: [],
  image: '/images/test.png',
};

const ruteniaMachine: Machine = {
  id: 'rutenia_test_machine',
  name: 'Тестовая машина',
  faction: 'rutenia' as FactionID,
  cost: 120,
  rank: 3,
  fire_rate: 2,
  ammo_max: 10,
  durability_max: 15,
  speed_sectors: [{ min_durability: 1, max_durability: 15, speed: 10 }],
  weapons: [{ name: 'Оружие', range: 'D12', power: '2D6' }],
  image: '/images/machine.png',
};

function makeMission(participants: MissionParticipant[]): Mission {
  return {
    id: 'test-mission',
    name: 'Тестовая миссия',
    order: 1,
    campaign: 'test',
    factions: ['rutenia'],
    briefing: {},
    parameters: {},
    objectives: {},
    participants: { rutenia: participants },
  };
}

describe('buildMissionArmy', () => {
  it('(a) builds a squad ArmyUnit from a participant whose unitId matches', () => {
    const mission = makeMission([
      { name: 'Тестовый отряд', type: 'squad', unitId: 'rutenia_test_squad' },
    ]);

    const result = buildMissionArmy(mission, 'rutenia', [ruteniaSquad], []);

    expect(result.units).toHaveLength(1);
    expect(result.units[0].type).toBe('squad');
    expect(result.units[0].data.id).toBe('rutenia_test_squad');
    expect(result.units[0].instanceNumber).toBe(1);
    expect(result.totalCost).toBe(50);
  });

  it('(a) also resolves a machine participant from the machines list', () => {
    const mission = makeMission([
      { name: 'Тестовая машина', type: 'machine', unitId: 'rutenia_test_machine' },
    ]);

    const result = buildMissionArmy(mission, 'rutenia', [], [ruteniaMachine]);

    expect(result.units).toHaveLength(1);
    expect(result.units[0].type).toBe('machine');
    expect(result.units[0].data.id).toBe('rutenia_test_machine');
    expect(result.totalCost).toBe(120);
  });

  it('(b) skips a participant whose unitId is not in squads or machines', () => {
    const mission = makeMission([
      { name: 'Неизвестный', type: 'squad', unitId: 'does_not_exist' },
    ]);

    const result = buildMissionArmy(mission, 'rutenia', [ruteniaSquad], []);

    expect(result.units).toHaveLength(0);
    expect(result.totalCost).toBe(0);
  });

  it('(b) skips a participant with no unitId at all (e.g. a pilot entry)', () => {
    const mission = makeMission([
      { name: 'Пилот', type: 'squad' },
      { name: 'Тестовый отряд', type: 'squad', unitId: 'rutenia_test_squad' },
    ]);

    const result = buildMissionArmy(mission, 'rutenia', [ruteniaSquad], []);

    expect(result.units).toHaveLength(1);
    expect(result.units[0].data.id).toBe('rutenia_test_squad');
  });

  it('(c) count > 1 creates that many instances with incrementing instanceNumber', () => {
    const mission = makeMission([
      { name: 'Тестовый отряд', type: 'squad', unitId: 'rutenia_test_squad', count: 3 },
    ]);

    const result = buildMissionArmy(mission, 'rutenia', [ruteniaSquad], []);

    expect(result.units).toHaveLength(3);
    expect(result.units.map((u) => u.instanceNumber)).toEqual([1, 2, 3]);
    // Every instance of the same squad template gets its own instanceId.
    const instanceIds = result.units.map((u) => u.instanceId);
    expect(new Set(instanceIds).size).toBe(3);
    expect(result.totalCost).toBe(150); // 50 × 3
  });

  it('returns an empty BuiltArmy when the faction has no participants', () => {
    const mission: Mission = {
      ...makeMission([]),
      participants: { polaris: [{ name: 'Чужой', type: 'squad', unitId: 'x' }] },
    };

    const result = buildMissionArmy(mission, 'rutenia', [ruteniaSquad], []);

    expect(result.units).toHaveLength(0);
    expect(result.totalCost).toBe(0);
  });
});
