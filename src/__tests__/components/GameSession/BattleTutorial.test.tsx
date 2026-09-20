import { render, screen, fireEvent } from '@testing-library/react';
import { BattleTutorial } from '@/components/GameSession/BattleTutorial';

// jsdom без PointerEvent — диспатчим сами (см. useCardSwipe.test.tsx)
const firePointer = (el: Element, type: string, init: Record<string, number>) => {
  const ev = new Event(type, { bubbles: true });
  Object.assign(ev, init);
  fireEvent(el, ev);
};
const drag = (el: Element, fromX: number, toX: number) => {
  firePointer(el, 'pointerdown', { pointerId: 1, clientX: fromX, clientY: 50 });
  firePointer(el, 'pointermove', { pointerId: 1, clientX: toX, clientY: 50 });
  firePointer(el, 'pointerup', { pointerId: 1, clientX: toX, clientY: 50 });
};

describe('BattleTutorial', () => {
  it('шаги: свайп влево → вправо → СПИСОК → «В бой» зовёт onFinish', () => {
    const onFinish = jest.fn();
    render(<BattleTutorial onFinish={onFinish} />);

    const card = screen.getByTestId('battle-tutorial-demo-card');
    expect(screen.getByText('СВАЙП ВЛЕВО — ГОТОВ')).toBeInTheDocument();

    drag(card, 200, 100); // влево — шаг 1
    expect(screen.getByText('СВАЙП ВПРАВО — УБИТ')).toBeInTheDocument();
    expect(screen.getByText('ГОТОВ')).toBeInTheDocument();

    drag(card, 100, 200); // вправо — финальный шаг
    expect(screen.getByText('ШПАРГАЛКА БОЯ')).toBeInTheDocument();
    // финальный шаг — рекап жестов (плейтест: «там про свайп не сказано»;
    // 2026-09-20: + свайп вверх по панели = список юнитов)
    expect(screen.getByText('← свайп: готов')).toBeInTheDocument();
    expect(screen.getByText('убит: свайп →')).toBeInTheDocument();
    expect(screen.getByText('список: панель ↑')).toBeInTheDocument();
    // ...и нажатий: выстрелы, ГОТОВ; убит — только свайп вправо
    // (кнопки «череп» нет — свайп единственный путь убить/оживить)
    expect(screen.getByText(/Статы бойца/)).toBeInTheDocument();
    expect(screen.getByText(/ГОТОВ/)).toBeInTheDocument();
    expect(screen.getByText(/убит — свайп вправо/)).toBeInTheDocument();
    // цикл выстрела (плейтест: «про то как стрелять и делать действия»)
    expect(screen.getByText(/Выстрел:/)).toBeInTheDocument();
    expect(screen.getByText(/ПРИНЯТЬ/)).toBeInTheDocument();
    expect(screen.queryByText(/череп/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('battle-tutorial-demo-card')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('battle-tutorial-finish'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('шаг двигает только жест нужного направления', () => {
    render(<BattleTutorial onFinish={jest.fn()} />);
    const card = screen.getByTestId('battle-tutorial-demo-card');

    drag(card, 100, 200); // вправо на шаге 0 — не то
    expect(screen.getByText('СВАЙП ВЛЕВО — ГОТОВ')).toBeInTheDocument();

    drag(card, 200, 100); // влево — шаг 1
    drag(card, 200, 100); // снова влево на шаге 1 — не то
    expect(screen.getByText('СВАЙП ВПРАВО — УБИТ')).toBeInTheDocument();
  });

  it('«Пропустить» завершает сразу с любого шага', () => {
    const onFinish = jest.fn();
    render(<BattleTutorial onFinish={onFinish} />);
    fireEvent.click(screen.getByTestId('battle-tutorial-skip'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('Escape завершает туториал, фокус попадает в диалог (a11y)', () => {
    const onFinish = jest.fn();
    render(<BattleTutorial onFinish={onFinish} />);
    const dialog = screen.getByRole('dialog');
    const panel = dialog.firstElementChild as HTMLElement;
    expect(document.activeElement).toBe(panel);
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
