/**
 * <ProvenanceRow> АВБ dedup contract.
 *
 * АВБ marks every non-Технолог entity, but a unit already attributed to the
 * generic `'avb'` source shows «АВБ» as its source chip — so the standalone
 * `AlternativeVersionBadge` (data-testid="avb-badge") must be SUPPRESSED for it
 * to avoid a double mark. Named communities (Star System, Звёздные Системы)
 * keep their specific chip AND get the badge on top. Official (Технолог) content
 * gets no АВБ at all. This test locks that three-way contract.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProvenanceRow } from '@/components/encyclopedia/AttributionLabel';
import { getEncyclopediaUnit, getFactions } from '@/lib/encyclopedia-registry';
import { resolveUnitProvenance, resolveFactionProvenance, type Provenance } from '@/lib/provenance';

const renderRow = (p: Provenance) =>
  render(<ProvenanceRow provenance={p} withHeader={false} withContribute={false} />);

describe('ProvenanceRow — АВБ dedup contract', () => {
  it('official (tehnolog): no standalone АВБ badge', () => {
    renderRow({ origin: 'tehnolog', loreAuthor: 'tehnolog' });
    expect(screen.queryByTestId('avb-badge')).toBeNull();
  });

  it('named community (star_system): shows the standalone АВБ badge', () => {
    renderRow({ origin: 'star_system', loreAuthor: 'star_system' });
    expect(screen.getByTestId('avb-badge')).toBeInTheDocument();
  });

  it('named community (universestarsys): shows the standalone АВБ badge', () => {
    renderRow({ origin: 'universestarsys', loreAuthor: 'universestarsys' });
    expect(screen.getByTestId('avb-badge')).toBeInTheDocument();
  });

  it('generic avb: no standalone badge (the chip already reads АВБ), but «АВБ» is present', () => {
    const { container } = renderRow({ origin: 'avb', loreAuthor: 'avb' });
    expect(screen.queryByTestId('avb-badge')).toBeNull();
    expect(container.textContent).toContain('АВБ');
  });
});

describe('ProvenanceRow — named-author credit chip', () => {
  const novel = { author: 'V.Chertischev', work: 'Битва за Велиан', year: 2022 };

  it('renders the credit chip when provenance.credit is set', () => {
    const { container } = renderRow({ origin: 'tehnolog', loreAuthor: 'tehnolog', credit: novel });
    expect(screen.getByTestId('lore-credit-chip')).toBeInTheDocument();
    // Author + work + year all render (the uppercase is CSS-only, so text keeps original case).
    expect(container.textContent).toContain('V.Chertischev');
    expect(container.textContent).toContain('Битва за Велиан');
    expect(container.textContent).toContain('2022');
  });

  it('does not render a credit chip when no credit is set', () => {
    renderRow({ origin: 'tehnolog', loreAuthor: 'tehnolog' });
    expect(screen.queryByTestId('lore-credit-chip')).toBeNull();
  });

  it('credit is orthogonal to the АВБ badge — a tehnolog-origin novel stays non-АВБ', () => {
    renderRow({ origin: 'tehnolog', loreAuthor: 'tehnolog', credit: novel });
    expect(screen.queryByTestId('avb-badge')).toBeNull();
    expect(screen.getByTestId('lore-credit-chip')).toBeInTheDocument();
  });
});

describe('ProvenanceRow — мини-АВБ-марка на кредит-чипе (не-Технолог книга)', () => {
  const kosari = { author: 'V.Chertischev', work: 'Косары' };

  it('loreAuthor ≠ tehnolog → credit chip carries the mini АВБ mark', () => {
    // Official unit, independent-author novel lore: entity stays non-АВБ, the source flags it.
    renderRow({ origin: 'tehnolog', loreAuthor: 'avb', credit: kosari });
    expect(screen.getByTestId('credit-avb-mark')).toBeInTheDocument();
    // No entity-level badge — the mark on the source is the only АВБ signal.
    expect(screen.queryByTestId('avb-badge')).toBeNull();
  });

  it('loreAuthor = tehnolog (Справочник/Летопись) → no mark on the credit chip', () => {
    renderRow({ origin: 'tehnolog', loreAuthor: 'tehnolog', credit: { author: 'X', work: 'Справочник техники' } });
    expect(screen.queryByTestId('credit-avb-mark')).toBeNull();
  });

  it('no credit → no mark, even when the lore author is a community', () => {
    renderRow({ origin: 'tehnolog', loreAuthor: 'star_system' });
    expect(screen.queryByTestId('credit-avb-mark')).toBeNull();
    expect(screen.queryByTestId('lore-credit-chip')).toBeNull();
  });

  it('origin avb: мини-марка подавлена — org-чип строки уже читается «АВБ» (dedup, кейс киберпехоты)', () => {
    // Симметрия с полным бейджем: при origin==='avb' свёрнутый чип источника уже
    // читается «АВБ» → мини-марка на кредит-чипе не дублирует его.
    const { container } = renderRow({
      origin: 'avb',
      loreAuthor: 'avb',
      credit: { author: 'V.Chertischev', work: 'Штурмовики Протектората' },
    });
    expect(screen.getByTestId('lore-credit-chip')).toBeInTheDocument();
    expect(screen.queryByTestId('credit-avb-mark')).toBeNull();
    expect(screen.queryByTestId('avb-badge')).toBeNull();
    // «АВБ» остаётся в строке ровно один раз — самим org-чипом.
    expect(container.textContent).toContain('АВБ');
  });

  it('штурмовая киберпехота (реальные данные): кредит есть, но без двойного АВБ', () => {
    // Единственный юнит с origin avb + кредитом: строка = [АВБ · сообщество] +
    // [V.Chertischev · Штурмовики Протектората] — и НИЧЕГО изумрудного сверх того.
    const unit = getEncyclopediaUnit('protectorate_shturmovaya_kiber_pehota')!;
    expect(unit).toBeTruthy();
    renderRow(resolveUnitProvenance(unit));
    expect(screen.getByTestId('lore-credit-chip')).toBeInTheDocument();
    expect(screen.queryByTestId('credit-avb-mark')).toBeNull();
    expect(screen.queryByTestId('avb-badge')).toBeNull();
  });
});

describe('ProvenanceRow — массив кредитов (лор из нескольких книг)', () => {
  it('рендерит по одному кредит-чипу на каждую книгу', () => {
    const { container } = renderRow({
      origin: 'tehnolog',
      loreAuthor: 'avb',
      credit: [
        { author: 'V.Chertischev', work: 'Битва за Велиан', year: 2022 },
        { author: 'V.Chertischev', work: 'Имперские войны' },
      ],
    });
    const chips = screen.getAllByTestId('lore-credit-chip');
    expect(chips).toHaveLength(2);
    expect(container.textContent).toContain('Битва за Велиан');
    expect(container.textContent).toContain('Имперские войны');
    // Каждая не-Технолог книга помечается мини-АВБ (origin tehnolog → dedup не срабатывает).
    expect(screen.getAllByTestId('credit-avb-mark')).toHaveLength(2);
  });

  it('фракция Протекторат (реальные данные): 3 кредит-чипа на карточке', () => {
    const f = getFactions().find((x) => x.id === 'protectorate')!;
    renderRow(resolveFactionProvenance(f));
    expect(screen.getAllByTestId('lore-credit-chip')).toHaveLength(3);
  });
});
