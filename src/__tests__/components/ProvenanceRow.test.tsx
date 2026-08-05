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
import type { Provenance } from '@/lib/provenance';

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
  const novel = { author: 'Chertischev', work: 'Битва за Велиан', year: 2022 };

  it('renders the credit chip when provenance.credit is set', () => {
    const { container } = renderRow({ origin: 'tehnolog', loreAuthor: 'tehnolog', credit: novel });
    expect(screen.getByTestId('lore-credit-chip')).toBeInTheDocument();
    // Author + work + year all render (the uppercase is CSS-only, so text keeps original case).
    expect(container.textContent).toContain('Chertischev');
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
