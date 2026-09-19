import { render, fireEvent, screen } from '@testing-library/react';
import { useCardSwipe } from '@/hooks/useCardSwipe';

/** Проба: карточка с дочерним кликабельным элементом (как фото/статы бойца) */
function Probe({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  const swipe = useCardSwipe({ onSwipeLeft: onLeft, onSwipeRight: onRight });
  return (
    <div data-testid="probe" {...swipe.handlers} style={swipe.style}>
      <button data-testid="child" onClick={onLeft}>child</button>
    </div>
  );
}

describe('useCardSwipe', () => {
  // jsdom не имеет PointerEvent — RTL-фолбэк теряет clientX/pointerId.
  // Диспатчим сами: Event + прямое присвоение координат (React их читает).
  const firePointer = (el: Element, type: string, init: Record<string, number>) => {
    const ev = new Event(type, { bubbles: true });
    Object.assign(ev, init);
    fireEvent(el, ev);
  };

  const drag = (fromX: number, toX: number, fromY = 50, toY = 50) => {
    const probe = screen.getByTestId('probe');
    firePointer(probe, 'pointerdown', { pointerId: 1, clientX: fromX, clientY: fromY });
    firePointer(probe, 'pointermove', { pointerId: 1, clientX: toX, clientY: toY });
    firePointer(probe, 'pointerup', { pointerId: 1, clientX: toX, clientY: toY });
  };

  it('свайп влево за порог — onSwipeLeft', () => {
    const onLeft = jest.fn();
    const onRight = jest.fn();
    render(<Probe onLeft={onLeft} onRight={onRight} />);
    drag(200, 110);
    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onRight).not.toHaveBeenCalled();
  });

  it('свайп вправо за порог — onSwipeRight', () => {
    const onLeft = jest.fn();
    const onRight = jest.fn();
    render(<Probe onLeft={onLeft} onRight={onRight} />);
    drag(200, 290);
    expect(onRight).toHaveBeenCalledTimes(1);
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('недотяг — ничего не срабатывает', () => {
    const onLeft = jest.fn();
    const onRight = jest.fn();
    render(<Probe onLeft={onLeft} onRight={onRight} />);
    drag(200, 175); // −25px < порога 56
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('вертикальное движение — не жест (нативный скролл), ничего не срабатывает', () => {
    const onLeft = jest.fn();
    const onRight = jest.fn();
    render(<Probe onLeft={onLeft} onRight={onRight} />);
    drag(200, 200, 50, 220);
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('click после жеста гасится, обычный click — нет', () => {
    const onLeft = jest.fn();
    render(<Probe onLeft={onLeft} onRight={jest.fn()} />);

    // Обычный клик по дочернему элементу работает
    fireEvent.click(screen.getByTestId('child'));
    expect(onLeft).toHaveBeenCalledTimes(1);

    // После реального жеста клик (шлёпнулся палец) не долетает до цели
    drag(200, 100);
    expect(onLeft).toHaveBeenCalledTimes(2); // сам свайп
    fireEvent.click(screen.getByTestId('child'));
    expect(onLeft).toHaveBeenCalledTimes(2); // клик поглощён

    // Следующий клик снова работает (гашение одноразовое)
    fireEvent.click(screen.getByTestId('child'));
    expect(onLeft).toHaveBeenCalledTimes(3);
  });

  it('второй палец не сбивает идущий жест', () => {
    const onRight = jest.fn();
    render(<Probe onLeft={jest.fn()} onRight={onRight} />);
    const probe = screen.getByTestId('probe');
    // первый палец ведёт горизонтальный жест
    firePointer(probe, 'pointerdown', { pointerId: 1, clientX: 200, clientY: 50 });
    firePointer(probe, 'pointermove', { pointerId: 1, clientX: 150, clientY: 50 });
    // ладонь/второй палец приземлился — игнорируется
    firePointer(probe, 'pointerdown', { pointerId: 2, clientX: 300, clientY: 60 });
    // первый палесь довёл жест и отпустил
    firePointer(probe, 'pointermove', { pointerId: 1, clientX: 290, clientY: 50 });
    firePointer(probe, 'pointerup', { pointerId: 1, clientX: 290, clientY: 50 });
    expect(onRight).toHaveBeenCalledTimes(1);
    // чужой pointerup ничего не делает
    firePointer(probe, 'pointerup', { pointerId: 2, clientX: 300, clientY: 60 });
    expect(onRight).toHaveBeenCalledTimes(1);
  });

  it('во время жеста карточка смещается transform-ом', () => {
    render(<Probe onLeft={jest.fn()} onRight={jest.fn()} />);
    const probe = screen.getByTestId('probe');
    firePointer(probe, 'pointerdown', { pointerId: 1, clientX: 200, clientY: 50 });
    firePointer(probe, 'pointermove', { pointerId: 1, clientX: 120, clientY: 50 });
    expect(probe.style.transform).toContain('translateX(-');
    firePointer(probe, 'pointerup', { pointerId: 1, clientX: 120, clientY: 50 });
    expect(probe.style.transform).toBe('translateX(0)');
  });
});
