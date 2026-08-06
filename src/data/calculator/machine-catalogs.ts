import type { MonoblockId, ChassisId, WeaponProperty } from '@/lib/editor/types';

export interface Monoblock {
  id: MonoblockId;
  name: string;
  baseArmor: number;
  baseSpeed: number;
  ammoTonnage: number;
  fireRate: number;
  rank: number;
  weightClass: 'Лёгкий' | 'Средний' | 'Тяжёлый' | 'Сверхтяж';
}

export interface Chassis {
  id: ChassisId;
  name: string;
  armorMod: number;
  speedMod: number;
  flyer: boolean;
  stationary: boolean;
}

export interface ArsenalPreset {
  id: string;
  name: string;
  range: string;        // 'D12' | '2D20' | 'D6+2' | 'ББ'
  power: string;        // '3D12' | 'D20+3' | '1'|'2'|'3'
  ammo: number;
  property: WeaponProperty | null;
  category: 'Огнестрельное' | 'Ракетное' | 'Энергетическое' | 'ББ';
  /** Цена из xlsx «Арсенал» — контрольное значение для тестов */
  expectedCost: number;
}

export const MONOBLOCKS: Monoblock[] = [
  { id: 'РМ-1П', name: 'РМ-1П (лёгкий)',  baseArmor: 11, baseSpeed: 6, ammoTonnage: 18, fireRate: 2, rank: 3, weightClass: 'Лёгкий' },
  { id: 'РМ-1',  name: 'РМ-1 (средний)',  baseArmor: 14, baseSpeed: 5, ammoTonnage: 18, fireRate: 2, rank: 3, weightClass: 'Средний' },
  { id: 'РМ-2',  name: 'РМ-2 (тяжёлый)',  baseArmor: 15, baseSpeed: 4, ammoTonnage: 16, fireRate: 2, rank: 3, weightClass: 'Тяжёлый' },
  { id: 'УМ-1',  name: 'УМ-1 (св.тяж.)',  baseArmor: 15, baseSpeed: 3, ammoTonnage: 20, fireRate: 2, rank: 3, weightClass: 'Сверхтяж' },
  { id: 'УМ-2',  name: 'УМ-2 (универс.)', baseArmor: 12, baseSpeed: 5, ammoTonnage: 16, fireRate: 2, rank: 3, weightClass: 'Средний' },
];

export const CHASSIS: Chassis[] = [
  { id: 'Шагатель',    name: 'Шагатель',          armorMod:  0, speedMod:  0, flyer: false, stationary: false },
  { id: 'Траккер',     name: 'Траккер (+1 бр/−1 ск)', armorMod:  1, speedMod: -1, flyer: false, stationary: false },
  { id: 'Гравилёт',    name: 'Гравилёт (−4 бр/+2 ск, полёт)', armorMod: -4, speedMod:  2, flyer: true,  stationary: false },
  { id: 'Стационарное', name: 'Стационарное (орудие)', armorMod: 0, speedMod: 0, flyer: false, stationary: true },
];

/** Сектора скорости по классу тонажа (3 сектора: полная → средняя → низкая прочность). Из xlsx «Моноблоки и шасси». */
export const WEIGHT_SPEED_SECTORS: Record<Monoblock['weightClass'], number[]> = {
  'Лёгкий':   [6, 5, 4],
  'Средний':  [5, 4, 3],
  'Тяжёлый':  [4, 3, 2],
  'Сверхтяж': [3, 2, 1],
};

/** Пресеты орудий из xlsx «Арсенал» (строки 59–85). expectedCost — контрольная цена. */
export const ARSENAL_PRESETS: ArsenalPreset[] = [
  { id: 'triplet_mk56',    name: 'Лёгкий 3-ствольный пулемёт Триплет Mk56', range: 'D12', power: '2D6',  ammo: 6, property: 'burst3', category: 'Огнестрельное', expectedCost: 20 },
  { id: 'mg_546x2',        name: 'Двуствольный лёгкий пулемёт MG-546X2',    range: 'D12', power: '2D6',  ammo: 6, property: null,     category: 'Огнестрельное', expectedCost: 18 },
  { id: 'vulkan_mk29',     name: 'Шестиствольный пулемёт Вулкан Мк29',      range: 'D12', power: '3D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 57 },
  { id: 'mg_442x4',        name: '4-ствольный пулемёт MG-442X4',            range: 'D12', power: '3D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 57 },
  { id: 'sw_mk95',         name: 'Двуствольный пулемёт S&W Mk95',           range: 'D12', power: '2D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 41 },
  { id: 'arc_20s',         name: 'Лёгкая бронебойная пушка AрC-20S',        range: 'D20', power: 'D20',  ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 29 },
  { id: 'gatling_mk20',    name: 'Шестиствольная авт. пушка Гатлинг Мк20', range: 'D12', power: '3D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 57 },
  { id: 'ats_35x2',        name: 'Двуствольная бронебойная пушка АТС-35Х2', range: 'D20', power: '2D20', ammo: 4, property: null,     category: 'Огнестрельное', expectedCost: 76 },
  { id: 'bambuk_atc40',    name: 'Скорострельная пушка Бамбук ATC-40',      range: 'D12', power: 'D20',  ammo: 4, property: null,     category: 'Ракетное',      expectedCost: 24 },
  { id: 'taifun_mk40',     name: 'Сверхтяжёлый пулемёт Тайфун S&W Mk40',    range: 'D12', power: '2D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 41 },
  { id: 'ats_56x2',        name: 'Авт. бронебойная пушка АТС-56X2',         range: 'D12', power: 'D20',  ammo: 4, property: null,     category: 'Ракетное',      expectedCost: 24 },
  { id: 'atsm_56d',        name: 'Скорострельная авт. пушка АТСМ-56д',      range: 'D12', power: 'D20',  ammo: 4, property: null,     category: 'Ракетное',      expectedCost: 24 },
  { id: 'ats_76',          name: 'Тяжёлая бронебойная пушка АТС-76',        range: 'D12', power: '2D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 41 },
  { id: 'molot',           name: 'Пусковая установка Молот',                range: 'D12', power: 'D20',  ammo: 3, property: null,     category: 'Ракетное',      expectedCost: 23 },
  { id: 'dlinny_luk_mk25', name: 'Спаренная ракетная Длинный лук Mk25',     range: 'D12', power: 'D20',  ammo: 2, property: 'blast1', category: 'Ракетное',      expectedCost: 27 },
  { id: 'shtorm',          name: 'Спаренная пусковая Шторм',                range: 'D12', power: '2D20', ammo: 1, property: 'blast2', category: 'Ракетное',      expectedCost: 79 },
  { id: 'svet_mech_lg25',  name: 'Лазерная пушка Световой меч LG-25',       range: '2D12', power: 'D20', ammo: 4, property: null,     category: 'Энергетическое', expectedCost: 36 },
  { id: 'drakone_plamya',  name: 'Плазменная пушка Драконье пламя',         range: 'D12', power: 'D20+3', ammo: 4, property: null,    category: 'Энергетическое', expectedCost: 30 },
  { id: 'power_dart_img1m', name: 'Импульсная пушка Power Dart IMG-1M',     range: '2D12', power: 'D20', ammo: 4, property: null,     category: 'Энергетическое', expectedCost: 36 },
  { id: 'garpun_pb1m',     name: 'Энергетический гарпун Power Bolt PB-1M',  range: 'D6+2', power: '2D20', ammo: 4, property: null,    category: 'Энергетическое', expectedCost: 73 },
  // ББ-оружие (манипуляторы): price == rank
  { id: 'mekh_pila',        name: 'Механическая пила',          range: 'ББ', power: '2', ammo: 0, property: null, category: 'ББ', expectedCost: 2 },
  { id: 'buldozernyi_otval', name: 'Бульдозерный отвал',        range: 'ББ', power: '3', ammo: 0, property: null, category: 'ББ', expectedCost: 3 },
  { id: 'kulak_manipulator', name: 'Кулак-манипулятор / Мех. пила', range: 'ББ', power: '2', ammo: 0, property: null, category: 'ББ', expectedCost: 2 },
  { id: 'kleshnya',         name: 'Клешня',                     range: 'ББ', power: '1', ammo: 0, property: null, category: 'ББ', expectedCost: 1 },
];
