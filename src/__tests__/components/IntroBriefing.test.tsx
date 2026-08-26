// src/__tests__/components/IntroBriefing.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { IntroBriefing } from '@/components/rules/IntroBriefing';

describe('IntroBriefing', () => {
  it('рендерит три шага брифинга', () => {
    render(<IntroBriefing onStart={() => {}} />);
    expect(screen.getByTestId('intro-briefing')).toBeInTheDocument();
    expect(screen.getByText('ПРАВИЛА')).toBeInTheDocument();
    expect(screen.getByText('АРМИЯ')).toBeInTheDocument();
    expect(screen.getByText('БОЙ')).toBeInTheDocument();
  });

  it('клик «Начать» вызывает onStart', () => {
    const onStart = jest.fn();
    render(<IntroBriefing onStart={onStart} />);
    fireEvent.click(screen.getByTestId('intro-start-button'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
