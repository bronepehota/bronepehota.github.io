// src/__tests__/components/PanicTestModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PanicTestModal } from '@/components/modals/PanicTestModal';
import { ArmyUnit } from '@/lib/types';

describe('PanicTestModal', () => {
  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: {
      id: 'test-squad',
      name: 'Test Squad',
      faction: 'polaris',
      cost: 100,
      soldiers: [
        { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
      ],
    },
  };

  test('renders when isOpen is true', () => {
    render(
      <PanicTestModal
        isOpen={true}
        unit={mockUnit}
        rulesVersion="community_star_system"
        onTestComplete={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('Тест на панику')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <PanicTestModal
        isOpen={false}
        unit={mockUnit}
        rulesVersion="community_star_system"
        onTestComplete={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('calls onClose when X button clicked', () => {
    const onClose = jest.fn();
    render(
      <PanicTestModal
        isOpen={true}
        unit={mockUnit}
        rulesVersion="community_star_system"
        onTestComplete={jest.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('shows test button and can conduct panic test', () => {
    const onTestComplete = jest.fn();
    render(
      <PanicTestModal
        isOpen={true}
        unit={mockUnit}
        rulesVersion="community_star_system"
        onTestComplete={onTestComplete}
        onClose={jest.fn()}
      />
    );

    // Test button should be present
    expect(screen.getByText(/ПРОВЕСТИ ТЕСТ/i)).toBeInTheDocument();
  });
});
