import { render, screen } from '@testing-library/react';
import { LoreText } from '@/components/ui/LoreText';

describe('LoreText', () => {
  it('пустой текст → ничего не рендерит', () => {
    const { container } = render(<LoreText text={null} className="x" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('один абзац → один <p> без обёртки', () => {
    const { container } = render(<LoreText text="Один абзац." className="text-sm" />);
    const p = screen.getByText('Один абзац.');
    expect(p.tagName).toBe('P');
    expect(p).toHaveClass('text-sm');
    expect(container.querySelector('div')).toBeNull();
  });
  it('два абзаца → div.space-y-3 с двумя <p>', () => {
    const { container } = render(<LoreText text={'Первый.\n\nВторой.'} className="text-sm" />);
    const wrapper = container.querySelector('div.space-y-3');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.querySelectorAll('p')).toHaveLength(2);
    expect(screen.getByText('Первый.')).toBeInTheDocument();
    expect(screen.getByText('Второй.')).toBeInTheDocument();
  });
});
