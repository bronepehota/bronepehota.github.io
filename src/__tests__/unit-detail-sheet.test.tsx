import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitDetailSheet } from '@/components/encyclopedia/UnitDetailSheet';
import type { Squad } from '@/lib/types';

const squad: Squad = {
  id: 'test_squad',
  name: 'Тестовый отряд',
  faction: 'polaris',
  cost: 40,
  soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 4, armor: 3 }],
};

describe('UnitDetailSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen={false} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the name, source stamp, and stat table when open', () => {
    render(<UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen onClose={() => {}} />);
    expect(screen.getByTestId('unit-detail-sheet')).toBeInTheDocument();
    expect(screen.getByText('Тестовый отряд')).toBeInTheDocument();
    expect(screen.getByText(/Технолог/)).toBeInTheDocument();
    expect(screen.getByText('D6')).toBeInTheDocument();
  });

  it('calls onAdd when the Добавить button is clicked', async () => {
    const onAdd = jest.fn();
    render(
      <UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen onClose={() => {}} onAdd={onAdd} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /добавить/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    render(<UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /закрыть/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
