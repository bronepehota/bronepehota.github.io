import { render, screen } from '@testing-library/react';
import OrganizersGuide from '@/components/tournaments/OrganizersGuide';

/**
 * «Напоминалка» для организаторов (идея Дениса Шнайдера, 2026-11-02):
 * критерии попадания турнира в общий рейтинг + что прислать с протоколом.
 */
describe('OrganizersGuide — критерии попадания в рейтинг', () => {
  it('четыре критерия: подсчёт, открытость, регламент, судья', () => {
    render(<OrganizersGuide />);

    const criteria = screen.getAllByTestId('criterion');
    expect(criteria).toHaveLength(4);
    expect(criteria[0]).toHaveTextContent('Система подсчёта');
    expect(criteria[0]).toHaveTextContent('очки режима'); // как считается рейтинг
    expect(criteria[1]).toHaveTextContent('Открытый турнир');
    expect(criteria[2]).toHaveTextContent('Регламент');
    expect(criteria[3]).toHaveTextContent('Судья');
  });

  it('блок «как попасть в рейтинг» — контакт VK группы', () => {
    render(<OrganizersGuide />);
    expect(screen.getByTestId('organizers-vk-link')).toHaveAttribute(
      'href',
      'https://vk.ru/lastbpcoder',
    );
  });
});
