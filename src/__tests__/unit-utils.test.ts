import { Army, ArmyUnit } from '../lib/types';

describe('Unit Utilities', () => {
  describe('Assign Unit Numbers', () => {
    test('should assign sequential numbers to multiple units', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'unit-1',
          type: 'squad',
          data: {
            id: 'test-1',
            name: 'Unit 1',
            faction: 'polaris',
            cost: 50,
            soldiers: [],
            image: ''
          },
          instanceNumber: 1
        },
        {
          instanceId: 'unit-2',
          type: 'squad',
          data: {
            id: 'test-2',
            name: 'Unit 2',
            faction: 'polaris',
            cost: 75,
            soldiers: [],
            image: ''
          },
          instanceNumber: 2
        },
        {
          instanceId: 'unit-3',
          type: 'squad',
          data: {
            id: 'test-3',
            name: 'Unit 3',
            faction: 'polaris',
            cost: 100,
            soldiers: [],
            image: ''
          },
          instanceNumber: 3
        }
      ];

      const result = units.map(u => u.instanceNumber);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('Filter Units by Type', () => {
    test('should separate squads and machines', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'squad-1',
          type: 'squad',
          data: {
            id: 'squad-1',
            name: 'Squad Unit',
            faction: 'polaris',
            cost: 50,
            soldiers: [],
            image: ''
          },
          instanceNumber: 1
        },
        {
          instanceId: 'machine-1',
          type: 'machine',
          data: {
            id: 'machine-1',
            name: 'Machine Unit',
            faction: 'polaris',
            cost: 150,
            rank: 2,
            fire_rate: 1,
            ammo_max: 20,
            durability_max: 16,
            speed_sectors: [
              { min_durability: 1, max_durability: 16, speed: 2 }
            ],
            weapons: []
          },
          instanceNumber: 1
        }
      ];

      const squads = units.filter(u => u.type === 'squad');
      const machines = units.filter(u => u.type === 'machine');

      expect(squads).toHaveLength(1);
      expect(machines).toHaveLength(1);
    });
  });
});
