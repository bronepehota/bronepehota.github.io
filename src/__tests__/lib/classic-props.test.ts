import { getClassicProps, withClassicProps } from '@/lib/classic-props';
import type { BuffDefinition } from '@/lib/modifier-types';

const ids = (bs: BuffDefinition[]) => bs.map(b => b.id);

describe('classic-props — классические спец-свойства из каталога по названию', () => {
  it('именное правило: кибер→Пр5, фелиц→Рм, штурмовая клон→Пр4', () => {
    expect(ids(getClassicProps('Киберпехота'))).toEqual(['jump_boost_5']);
    expect(ids(getClassicProps('Лёгкая роботизированная киберпехота'))).toEqual(['jump_boost_5']);
    expect(ids(getClassicProps('Штурмовая кибер-пехота'))).toEqual(['jump_boost_5']);
    expect(ids(getClassicProps('Фелицианская гвардия'))).toEqual(['mechanic']);
    expect(ids(getClassicProps('Спецназ планеты Фелиция Fox.1'))).toEqual(['mechanic']);
    expect(ids(getClassicProps('Лёгкая штурмовая клон-пехота'))).toEqual(['jump_boost_4']);
  });

  it('без совпадений и без названия — пусто', () => {
    expect(getClassicProps('Линейная клон-пехота')).toEqual([]);
    expect(getClassicProps(undefined)).toEqual([]);
  });

  it('определения приходят из каталога целиком (semantics не дублируем)', () => {
    const [pro5] = getClassicProps('Киберпехота');
    expect(pro5.name).toBe('Пр5');
    expect(pro5.oneTimeUse).toBe(true);
    expect(pro5.target).toBe('custom');
    const [rm] = getClassicProps('Фелицианская гвардия');
    expect(rm.name).toBe('Рм');
    expect(rm.oneTimeUse).toBeUndefined(); // постоянная способность
  });

  it('withClassicProps: явные бафы приоритетнее, дублей по id нет', () => {
    const inline = [{
      id: 'jump_boost_4', name: 'Пр4 (кастом)', description: 'своё описание',
      applyTo: ['soldier'], target: 'custom', value: 4, phase: 'always', icon: 'ArrowUp',
    } as unknown as BuffDefinition];
    // тот же id из правила не добавляется вторично
    expect(ids(withClassicProps(inline, 'Лёгкая штурмовая клон-пехота'))).toEqual(['jump_boost_4']);
    // другое свойство выводится рядом с явным
    expect(ids(withClassicProps(inline, 'Киберпехота'))).toEqual(['jump_boost_4', 'jump_boost_5']);
  });
});
