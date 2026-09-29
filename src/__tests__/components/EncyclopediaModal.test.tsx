import { render, screen } from '@testing-library/react';
import { EncyclopediaModal } from '@/components/modals/EncyclopediaModal';
import type { EnrichedUnit } from '@/lib/encyclopedia-utils';

// Минимальный EnrichedUnit: модалу нужны только лор-поля + шапочные id/name/faction.
const unit = (encyclopedia: Record<string, string>): EnrichedUnit =>
  ({
    id: 'star_system_polaris_test',
    name: 'Тестовый юнит',
    faction: 'polaris',
    type: 'squad',
    cost: 60,
    sources: [],
    soldiers: [],
    weapons: [],
    encyclopedia,
  } as unknown as EnrichedUnit);

function renderModal(encyclopedia: Record<string, string>) {
  return render(<EncyclopediaModal unit={unit(encyclopedia)} isOpen onClose={() => {}} />);
}

/** Секция находится по телетайп-метке (DATA_LORE / DATA_TACTICS / DATA_HISTORY). */
function sectionOf(label: string): HTMLElement {
  return screen.getByText(label).closest('section') as HTMLElement;
}

describe('EncyclopediaModal — лор-секции рендерятся через LoreText', () => {
  it('lore с \\n\\n-абзацами → несколько <p> с исходной типографикой лора', () => {
    renderModal({ lore: 'Первый абзац лора.\n\nВторой абзац лора.' });
    const paragraphs = sectionOf('DATA_LORE').querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(1);
    paragraphs.forEach((p) => expect(p).toHaveClass('font-oswald', 'text-military-sand', 'italic', 'border-l-4'));
    expect(screen.getByText('Первый абзац лора.')).toBeInTheDocument();
    expect(screen.getByText('Второй абзац лора.')).toBeInTheDocument();
  });

  it('tactics с \\n\\n-абзацами → несколько <p> с исходной типографикой тактики', () => {
    renderModal({ tactics: 'Первый абзац тактики.\n\nВторой абзац тактики.' });
    const paragraphs = sectionOf('DATA_TACTICS').querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(1);
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('font-oswald', 'text-military-sand');
      expect(p).not.toHaveClass('italic');
    });
    expect(screen.getByText('Второй абзац тактики.')).toBeInTheDocument();
  });

  it('history с \\n\\n-абзацами → несколько <p> с исходной типографикой истории', () => {
    renderModal({ history: 'Первый абзац истории.\n\nВторой абзац истории.' });
    const paragraphs = sectionOf('DATA_HISTORY').querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(1);
    paragraphs.forEach((p) => expect(p).toHaveClass('font-oswald', 'text-military-sand'));
    expect(screen.getByText('Второй абзац истории.')).toBeInTheDocument();
  });

  it('одноабзацный текст → ровно один <p> без div-обёртки (контракт LoreText)', () => {
    renderModal({ lore: 'Один абзац лора.' });
    const section = sectionOf('DATA_LORE');
    expect(section.querySelectorAll('p')).toHaveLength(1);
    expect(section.querySelector('div.space-y-3')).toBeNull();
  });

  it('пустой lore → секция DATA_LORE не рендерится', () => {
    renderModal({ tactics: 'Тактика.' });
    expect(screen.queryByText('DATA_LORE')).not.toBeInTheDocument();
    expect(screen.getByText('DATA_TACTICS')).toBeInTheDocument();
  });
});
