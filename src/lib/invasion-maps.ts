/**
 * Карты театров войн — серия из пяти карт вселенной «СтарСис» (Звёздные
 * Системы, vk.com/universestarsys, издание 2020): политико-военные карты
 * Доминиона по периодам имперских вторжений и их последствиям. Водяной знак
 * автора вшит в сами изображения; кредит-запись — CREDITS.universestarsys.
 *
 * Служит данными галерее-переключателю на хабе Истории («// КАРТЫ ТЕАТРОВ
 * ВОЙН») и одиночным фигурам в кампаниях волн (CAMPAIGN_MAP). Связи несут
 * собственные подписи: клиентский компонент не может читать fs-реестры
 * кампаний (gray-matter) — валидность слагов проверяется тестом.
 */
export interface MapLink {
  slug: string;
  label: string;
}

export interface InvasionMap {
  /** slug файла public/images/maps/<slug>.jpg */
  slug: string;
  /** Заголовок карты (как на самой карте). */
  title: string;
  /** Диапазон лет (как на карте). */
  years: string;
  /** Одна-две строки: что за период, что показывает легенда. */
  note: string;
  /** Связанные сущности канона. */
  related: { campaigns: MapLink[]; world: MapLink[] };
}

export const INVASION_MAPS: InvasionMap[] = [
  {
    slug: 'pervaya-volna-4451-4461',
    title: 'Первая волна вторжения',
    years: '4451–4461',
    note: 'Первый удар Империи Полярис по Доминиону: за десятилетие оккупированы окраинные миры; легенда различает оккупированные и варварские миры, буферную зону и Пыльную Зону.',
    related: {
      campaigns: [
        { slug: 'pervaya-volna-gront-i-rum', label: 'Первая волна: Гронт и Рун' },
        { slug: 'padenie-midgaarda', label: 'Падение Мидгаарда' },
      ],
      world: [
        { slug: 'gront', label: 'Гронт' },
        { slug: 'pylnaya-zona', label: 'Пыльная Зона' },
      ],
    },
  },
  {
    slug: 'vtoraya-volna-4478-4495',
    title: 'Вторая волна вторжения',
    years: '4478–4495',
    note: 'Глубокий прорыв имперских корпусов к сердцу Протектората: Альдебаран, Ле-Карн, тракты Золотой Сотни; фронт волнами докатывается до Блауда.',
    related: {
      campaigns: [
        { slug: 'vtoraya-volna', label: 'Вторая волна' },
        { slug: 'oborona-blauda', label: 'Оборона Блауда' },
      ],
      world: [{ slug: 'blaund', label: 'Блауд' }],
    },
  },
  {
    slug: 'tretiya-volna-4522-4528',
    title: 'Третья волна вторжения',
    years: '4522–4528',
    note: 'Восстания Советников, карательные экспедиции и супероружие обеих держав; волна замыкается штурмом Велиана и «Бдительным миром».',
    related: {
      campaigns: [
        { slug: 'tretiya-volna', label: 'Третья волна' },
        { slug: 'shturm-velyana', label: 'Штурм Велиана' },
      ],
      world: [{ slug: 'velian', label: 'Велиан' }],
    },
  },
  {
    slug: 'reydovye-voyny-4530-4543',
    title: 'Рейдовые войны',
    years: '4530–4543',
    note: 'Война без линии фронта: переоборудованные торговые суда Протектората бьют по внешней инфраструктуре Империи «булавочными уколами»; на карте впервые выделена Новофранкская конфедерация.',
    related: {
      campaigns: [{ slug: 'teklius', label: 'Сражение за Теклиус' }],
      world: [
        { slug: 'torgovyy-reyder', label: 'Торговый рейдер' },
        { slug: 'novofrankskaya-konfederaciya', label: 'Новофранкская конфедерация' },
      ],
    },
  },
  {
    slug: 'raskol-imperii-4550-4554',
    title: 'Раскол Империи',
    years: '4550–4554',
    note: 'За краем хроник энциклопедии: имперская оккупированная зона делится на квадранты, от Империи откалываются сегунат Дракона, анклав Имперской конфедерации и государства Алексея Долгорукого.',
    related: {
      campaigns: [],
      world: [
        { slug: 'novofrankskaya-konfederaciya', label: 'Новофранкская конфедерация' },
        { slug: 'lord-dolgorukiy', label: 'Лорд Долгорукий' },
      ],
    },
  },
];

/** Карта кампании — slug кампании → slug карты (фигура в теле кампании). */
export const CAMPAIGN_MAP: Record<string, string> = {
  'pervaya-volna-gront-i-rum': 'pervaya-volna-4451-4461',
  'vtoraya-volna': 'vtoraya-volna-4478-4495',
  'tretiya-volna': 'tretiya-volna-4522-4528',
};

/** Кредит серии карт — id из CREDITS (painted-images.ts). */
export const INVASION_MAPS_CREDIT_ID = 'universestarsys' as const;

export function getInvasionMap(slug: string): InvasionMap | undefined {
  return INVASION_MAPS.find((m) => m.slug === slug);
}
