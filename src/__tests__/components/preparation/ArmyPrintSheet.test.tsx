import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ArmyPrintSheet } from '@/components/preparation/ArmyPrintSheet';
import { Army, Machine, Squad } from '@/lib/types';

const squad: Squad = {
  id: 'sq1',
  name: 'Штурмовая группа',
  faction: 'polaris',
  cost: 135,
  image: '/images/squads/test.png',
  soldiers: [
    { num: 1, rank: 4, speed: 4, range: 'Д12', power: '2Д6', melee: 3, armor: 4 },
    { num: 2, rank: 3, speed: 4, range: 'Д6', power: 'Д6', melee: 2, armor: 4 },
  ],
};

const machine: Machine = {
  id: 'mc1',
  name: 'Раптор',
  faction: 'polaris',
  cost: 190,
  rank: 2,
  fire_rate: 1,
  ammo_max: 8,
  durability_max: 8,
  image: '/images/machines/test.png',
  speed_sectors: [{ min_durability: 1, max_durability: 8, speed: 5 }],
  weapons: [
    { name: 'Пусковая установка', range: 'Д12', power: 'Д20', ammo: 8 },
  ],
};

const army = (units: Army['units']): Army => ({
  name: 'Моя Армия',
  faction: 'polaris',
  units,
  totalCost: units.reduce((s, u) => s + u.data.cost, 0),
  pointBudget: 350,
  currentStep: 'preparation',
  isInBattle: false,
  currentTurn: 1,
});

describe('ArmyPrintSheet', () => {
  it('renders sheet header with faction, rules, budget/total and date', () => {
    render(<ArmyPrintSheet army={army([{ instanceId: 'a', type: 'squad', data: squad, instanceNumber: 1 }])} rulesLabel="Star System" machineDiscountActive={false} />);

    expect(screen.getByTestId('army-print-sheet')).toBeInTheDocument();
    // Поларис → фракция в шапке (display name)
    expect(screen.getByTestId('print-header').textContent).toMatch(/Полярис/i);
    expect(screen.getByTestId('print-header').textContent).toMatch(/Star System/);
    expect(screen.getByTestId('print-header').textContent).toMatch(/135/);
  });

  it('renders squad unit with number, cost and soldier stats table', () => {
    render(<ArmyPrintSheet army={army([{ instanceId: 'a', type: 'squad', data: squad, instanceNumber: 2 }])} rulesLabel="Star System" machineDiscountActive={false} />);

    expect(screen.getByTestId('print-unit-a').textContent).toMatch(/Штурмовая группа/);
    expect(screen.getByTestId('print-unit-a').textContent).toMatch(/#2/);
    expect(screen.getByTestId('print-unit-a').textContent).toMatch(/135/);
    // Статы бойцов таблицей + миниатюры
    expect(screen.getByTestId('print-unit-a').textContent).toMatch(/Д12/);
    expect(screen.getByTestId('print-unit-a').textContent).toMatch(/2Д6/);
    expect(screen.getAllByAltText(/Боец/).length).toBe(2);
  });

  it('renders machine unit with stats and weapons table', () => {
    render(<ArmyPrintSheet army={army([{ instanceId: 'm', type: 'machine', data: machine, instanceNumber: 1 }])} rulesLabel="Star System" machineDiscountActive={false} />);

    expect(screen.getByTestId('print-unit-m').textContent).toMatch(/Раптор/);
    expect(screen.getByTestId('print-unit-m').textContent).toMatch(/Пусковая установка/);
    expect(screen.getByTestId('print-unit-m').textContent).toMatch(/Д20/);
    // Боезапас орудия
    expect(screen.getByTestId('print-unit-m').textContent).toMatch(/8/);
    // Миниатюра машины
    expect(screen.getByAltText(/Раптор/)).toBeInTheDocument();
  });

  it('applies the machine cost discount to totals when active', () => {
    // машина 190 → фолбэк-скидка ceil10(133) = 140; итог 140
    render(<ArmyPrintSheet army={army([{ instanceId: 'm', type: 'machine', data: machine, instanceNumber: 1 }])} rulesLabel="Star System" machineDiscountActive={true} />);

    expect(screen.getByTestId('print-header').textContent).toMatch(/140/);
    expect(screen.getByTestId('print-header').textContent).toMatch(/−30%/);
  });
});
