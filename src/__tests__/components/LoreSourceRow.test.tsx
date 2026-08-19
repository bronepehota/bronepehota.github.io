/**
 * <LoreSourceRow> — компактная строка источника для Markdown-контента
 * (кампании «Хроник войн», главы «Истории вселенной»).
 *
 * Contract: «// ИСТОЧНИК» + either a named-author chip (a novel the text
 * retells — carrying the mini АВБ mark when the book is non-Технолог) or an
 * org chip («Издание «Технолог»» for the official Летопись chronicle).
 * Content with no attribution at all renders nothing.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoreSourceRow } from '@/components/encyclopedia/AttributionLabel';

describe('LoreSourceRow — строка источника кампаний и глав истории', () => {
  it('tehnolog без кредита: чип «Издание «Технолог»», без АВБ-марки', () => {
    const { container } = render(<LoreSourceRow loreAuthor="tehnolog" />);
    expect(screen.getByTestId('lore-source-row')).toBeInTheDocument();
    expect(container.textContent).toContain('Издание «Технолог»');
    expect(screen.queryByTestId('credit-avb-mark')).toBeNull();
  });

  it('не-Технолог кредит (роман): чип автора + мини-АВБ-марка', () => {
    const { container } = render(
      <LoreSourceRow
        loreAuthor="star_system"
        credit={{ author: 'Chertischev', work: 'Имперские войны' }}
      />,
    );
    expect(screen.getByTestId('lore-source-row')).toBeInTheDocument();
    expect(container.textContent).toContain('Chertischev');
    expect(container.textContent).toContain('Имперские войны');
    expect(screen.getByTestId('credit-avb-mark')).toBeInTheDocument();
  });

  it('кредит без явного loreAuthor трактуется как tehnolog — без АВБ-марки', () => {
    render(<LoreSourceRow credit={{ work: 'Справочник техники' }} />);
    expect(screen.getByTestId('lore-credit-chip')).toBeInTheDocument();
    expect(screen.queryByTestId('credit-avb-mark')).toBeNull();
  });

  it('без атрибуции вообще — не рендерится', () => {
    const { container } = render(<LoreSourceRow />);
    expect(container.firstChild).toBeNull();
  });
});
