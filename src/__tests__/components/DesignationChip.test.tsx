import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DesignationChip } from '@/components/encyclopedia/UnitDetail/DesignationChip';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = (encyclopedia?: Record<string, unknown>): EncyclopediaUnit =>
  ({ encyclopedia } as unknown as EncyclopediaUnit);

describe('DesignationChip — машинный индекс', () => {
  it('renders the designation code', () => {
    render(<DesignationChip unit={unit({ designation: 'БМР-1Г' })} />);
    expect(screen.getByTestId('unit-designation')).toHaveTextContent('БМР-1Г');
  });

  it('renders nothing without a designation', () => {
    const { container } = render(<DesignationChip unit={unit({ monoblock: 'РМ-1' })} />);
    expect(container.firstChild).toBeNull();
    const { container: c2 } = render(<DesignationChip unit={unit()} />);
    expect(c2.firstChild).toBeNull();
  });
});
