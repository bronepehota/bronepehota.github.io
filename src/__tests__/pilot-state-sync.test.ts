import { ArmyUnit, Squad, Machine } from '@/lib/types';

/**
 * Test helper to simulate machine toggle done logic
 * This mirrors the handleToggleDone logic from UnitCard.tsx for machines
 */
function toggleMachineDone(
  machineUnit: ArmyUnit,
  allUnits: ArmyUnit[]
): { updatedMachine: ArmyUnit; updatedSquad: ArmyUnit | null } {
  const newMachineDoneState = !machineUnit.isMachineDone;
  const updatedMachine = { ...machineUnit, isMachineDone: newMachineDoneState };

  // Also update pilot's done state
  let updatedSquad: ArmyUnit | null = null;
  if (updatedMachine.pilotInfo && updatedMachine.pilotInfo.alive) {
    const pilotSquad = allUnits.find(u => u.instanceId === updatedMachine.pilotInfo?.squadInstanceId);
    if (pilotSquad && pilotSquad.type === 'squad') {
      const soldierIndex = updatedMachine.pilotInfo.soldierIndex || 0;
      const newActions = [...(pilotSquad.actionsUsed || [])];
      newActions[soldierIndex] = {
        ...newActions[soldierIndex],
        done: newMachineDoneState
      };
      updatedSquad = { ...pilotSquad, actionsUsed: newActions };
    }
  }

  return { updatedMachine, updatedSquad };
}

/**
 * Test helper to simulate pilot death during survival test
 * This mirrors the handlePilotSurvivalTest logic from UnitCard.tsx
 */
function pilotDiedInSurvivalTest(
  machineUnit: ArmyUnit,
  allUnits: ArmyUnit[]
): { updatedMachine: ArmyUnit; updatedSquad: ArmyUnit | null } {
  if (!machineUnit.pilotInfo || !machineUnit.pilotInfo.alive) {
    return { updatedMachine: machineUnit, updatedSquad: null };
  }

  // Update machine's pilotInfo to mark pilot as dead
  const updatedPilotInfo = {
    squadInstanceId: machineUnit.pilotInfo.squadInstanceId || '',
    soldierIndex: machineUnit.pilotInfo.soldierIndex || 0,
    pilotArmor: machineUnit.pilotInfo.pilotArmor || 0,
    alive: false
  };
  const updatedMachine = { ...machineUnit, pilotInfo: updatedPilotInfo };

  // Also mark the soldier as dead in their squad
  let updatedSquad: ArmyUnit | null = null;
  const pilotSquad = allUnits.find(u => u.instanceId === machineUnit.pilotInfo?.squadInstanceId);
  if (pilotSquad && pilotSquad.type === 'squad') {
    const soldierIndex = machineUnit.pilotInfo.soldierIndex || 0;
    const currentDead = pilotSquad.deadSoldiers || [];
    const newDead = currentDead.includes(soldierIndex)
      ? currentDead
      : [...currentDead, soldierIndex];
    updatedSquad = { ...pilotSquad, deadSoldiers: newDead };
  }

  return { updatedMachine, updatedSquad };
}

// Mock data
const mockSoldier = {
  rank: 5,
  speed: 4,
  range: 'D6',
  power: '1D6',
  melee: 0,
  props: [],
  armor: 2
};

const mockSquad: Squad = {
  id: 'test_squad',
  name: 'Test Squad',
  shortName: 'TS',
  faction: 'polaris',
  cost: 100,
  image: '/test.jpg',
  soldiers: [mockSoldier, { ...mockSoldier, rank: 4 }]
};

const mockMachine: Machine = {
  id: 'test_machine',
  name: 'Test Machine',
  shortName: 'TM',
  faction: 'polaris',
  cost: 150,
  rank: 2,
  fire_rate: 2,
  ammo_max: 20,
  durability_max: 16,
  image: '/test-machine.jpg',
  speed_sectors: [
    { min_durability: 9, max_durability: 16, speed: 2 },
    { min_durability: 1, max_durability: 8, speed: 1 }
  ],
  weapons: [
    { name: 'Cannon', range: 'D12', power: '2D20' }
  ]
};

describe('Pilot State Synchronization', () => {
  describe('Machine toggle done synchronizes pilot state', () => {
    const createSquadUnit = (actionsUsed?: any[]): ArmyUnit => ({
      instanceId: 'squad-1',
      type: 'squad',
      data: mockSquad,
      instanceNumber: 1,
      actionsUsed
    });

    const createMachineUnit = (pilotInfo: any, isMachineDone = false): ArmyUnit => ({
      instanceId: 'machine-1',
      type: 'machine',
      data: mockMachine,
      instanceNumber: 1,
      pilotInfo,
      isMachineDone
    });

    test('when machine is marked done, pilot should also be marked done', () => {
      const squadUnit = createSquadUnit([
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      }, false);

      const allUnits = [squadUnit, machineUnit];
      const { updatedMachine, updatedSquad } = toggleMachineDone(machineUnit, allUnits);

      // Machine should be marked done
      expect(updatedMachine.isMachineDone).toBe(true);

      // Pilot should be marked done in squad
      expect(updatedSquad).not.toBeNull();
      expect(updatedSquad!.actionsUsed?.[0]?.done).toBe(true);
    });

    test('when machine is un-done, pilot should also be un-done', () => {
      const squadUnit = createSquadUnit([
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      }, true);

      const allUnits = [squadUnit, machineUnit];
      const { updatedMachine, updatedSquad } = toggleMachineDone(machineUnit, allUnits);

      // Machine should be un-done
      expect(updatedMachine.isMachineDone).toBe(false);

      // Pilot should be un-done in squad
      expect(updatedSquad).not.toBeNull();
      expect(updatedSquad!.actionsUsed?.[0]?.done).toBe(false);
    });

    test('only pilot soldier should be affected, other soldiers unchanged', () => {
      const squadUnit = createSquadUnit([
        { moved: false, shot: false, melee: false, done: false },
        { moved: true, shot: true, melee: false, done: true }
      ]);

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      }, false);

      const allUnits = [squadUnit, machineUnit];
      const { updatedSquad } = toggleMachineDone(machineUnit, allUnits);

      // First soldier (pilot) should be marked done
      expect(updatedSquad!.actionsUsed?.[0]?.done).toBe(true);

      // Second soldier (non-pilot) should be unchanged
      expect(updatedSquad!.actionsUsed?.[1]).toEqual({
        moved: true,
        shot: true,
        melee: false,
        done: true
      });
    });

    test('dead pilot should not be updated when machine toggles done', () => {
      const squadUnit = createSquadUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: false  // Pilot is already dead
      }, false);

      const allUnits = [squadUnit, machineUnit];
      const { updatedMachine, updatedSquad } = toggleMachineDone(machineUnit, allUnits);

      // Machine should still toggle
      expect(updatedMachine.isMachineDone).toBe(true);

      // Squad should not be updated (pilot is dead)
      expect(updatedSquad).toBeNull();
    });
  });

  describe('Pilot survival test death synchronization', () => {
    const createSquadUnit = (deadSoldiers?: number[]): ArmyUnit => ({
      instanceId: 'squad-1',
      type: 'squad',
      data: mockSquad,
      instanceNumber: 1,
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false }
      ],
      deadSoldiers
    });

    const createMachineUnit = (pilotInfo: any): ArmyUnit => ({
      instanceId: 'machine-1',
      type: 'machine',
      data: mockMachine,
      instanceNumber: 1,
      pilotInfo,
      currentDurability: 16
    });

    test('when pilot dies in survival test, marked dead in squad and on machine', () => {
      const squadUnit = createSquadUnit([]);

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      });

      const allUnits = [squadUnit, machineUnit];
      const { updatedMachine, updatedSquad } = pilotDiedInSurvivalTest(machineUnit, allUnits);

      // Machine pilotInfo should mark pilot as dead
      expect(updatedMachine.pilotInfo?.alive).toBe(false);

      // Squad should mark pilot as dead
      expect(updatedSquad).not.toBeNull();
      expect(updatedSquad!.deadSoldiers).toContain(0);
    });

    test('only pilot soldier should be marked dead, other soldiers alive', () => {
      const squadUnit = createSquadUnit([]);

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      });

      const allUnits = [squadUnit, machineUnit];
      const { updatedSquad } = pilotDiedInSurvivalTest(machineUnit, allUnits);

      // Only first soldier (pilot) should be dead
      expect(updatedSquad!.deadSoldiers).toEqual([0]);
      expect(updatedSquad!.deadSoldiers?.length).toBe(1);
    });

    test('already dead pilot should not be added to deadSoldiers again', () => {
      const squadUnit = createSquadUnit([0]); // Pilot already dead

      const machineUnit = createMachineUnit({
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      });

      const allUnits = [squadUnit, machineUnit];
      const { updatedSquad } = pilotDiedInSurvivalTest(machineUnit, allUnits);

      // Pilot should only appear once in deadSoldiers
      expect(updatedSquad!.deadSoldiers).toEqual([0]);
      expect(updatedSquad!.deadSoldiers?.length).toBe(1);
    });

    test('machine without pilot should not cause errors', () => {
      const squadUnit = createSquadUnit([]);

      const machineUnit = createMachineUnit(null); // No pilot

      const allUnits = [squadUnit, machineUnit];
      const { updatedMachine, updatedSquad } = pilotDiedInSurvivalTest(machineUnit, allUnits);

      // Should return unchanged
      expect(updatedMachine).toEqual(machineUnit);
      expect(updatedSquad).toBeNull();
    });
  });
});
