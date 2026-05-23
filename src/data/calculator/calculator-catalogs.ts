export interface RaceDef {
  id: string;
  name: string;
  rankBonus: number;
  speedBonus: number;
  armorBonus: number;
  meleeBonus: number;
  price: number;
}

export interface SquadTypeDef {
  id: string;
  name: string;
  rank: number;
  price: number;
}

export interface ArmorDef {
  id: string;
  name: string;
  armor: number;
  speed: number;
  speedReduced: number;
  price: number;
  mutantArmor?: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  range: string;
  power: string;
  price: number;
  isHeavy: boolean;
  macedonianRange?: string;
  macedonianPower?: string;
}

export interface MeleeWeaponDef {
  id: string;
  name: string;
  price: number;
}

export interface PropertyDef {
  id: string;
  name: string;
  price: number;
}

export const RACES: RaceDef[] = [
  { id: 'human',    name: 'Человек', rankBonus: 0,  speedBonus: 0, armorBonus: 0, meleeBonus: 0, price: 20 },
  { id: 'clone',    name: 'Клон',    rankBonus: -1, speedBonus: 0, armorBonus: 0, meleeBonus: 0, price: 10 },
  { id: 'cyborg',   name: 'Киборг',  rankBonus: 0,  speedBonus: 0, armorBonus: 1, meleeBonus: 0, price: 30 },
  { id: 'mutant',   name: 'Мутант',  rankBonus: 0,  speedBonus: 0, armorBonus: 2, meleeBonus: 2, price: 40 },
];

export const SQUAD_TYPES: SquadTypeDef[] = [
  { id: 'elite_heavy', name: 'Элитный тяжёлый отряд', rank: 5, price: 50 },
  { id: 'specnaz',     name: 'Спецназ',               rank: 4, price: 30 },
  { id: 'shock',       name: 'Ударное подразделение',  rank: 3, price: 20 },
  { id: 'main',        name: 'Основное подразделение', rank: 2, price: 15 },
  { id: 'militia',     name: 'Ополчение/Полиция',      rank: 1, price: 5  },
];

export const ARMOR_TYPES: ArmorDef[] = [
  { id: 'clothing',           name: 'Одежда',                            armor: 1, speed: 5, speedReduced: 4, price: 0,   mutantArmor: 3 },
  { id: 'light_helmet',       name: 'Шлем, лёгкая кирасса',             armor: 2, speed: 5, speedReduced: 4, price: 20,  mutantArmor: 4 },
  { id: 'heavy_kirass',       name: 'Тяжёлая кирасса, напленики',      armor: 3, speed: 5, speedReduced: 4, price: 60,  mutantArmor: 5 },
  { id: 'cyborg_base',        name: 'Киборг',                           armor: 4, speed: 4, speedReduced: 4, price: 90  },
  { id: 'shield_light',       name: 'Шлем, лёгкая кирасса, щит',       armor: 4, speed: 4, speedReduced: 3, price: 40,  mutantArmor: 6 },
  { id: 'heavy_infantry',     name: 'Тяжёлый пехотный доспех',          armor: 4, speed: 4, speedReduced: 3, price: 80,  mutantArmor: 6 },
  { id: 'felician_light',     name: 'Фелицианский лёгкий бронекостюм',  armor: 3, speed: 6, speedReduced: 5, price: 100 },
  { id: 'cyborg_light',       name: 'Киборг в лёгкой броне',           armor: 3, speed: 5, speedReduced: 3, price: 30  },
  { id: 'power_armor',        name: 'Бронекостюм',                      armor: 5, speed: 4, speedReduced: 3, price: 100, mutantArmor: 6 },
  { id: 'cyborg_heavy',       name: 'Киборг в тяжёлой броне',          armor: 5, speed: 4, speedReduced: 3, price: 120 },
  { id: 'exoskeleton',        name: 'Экзоскилет',                       armor: 6, speed: 3, speedReduced: 3, price: 140 },
];

export const WEAPONS: WeaponDef[] = [
  { id: 'pistol',          name: 'Пистолет',               range: 'Д6',   power: 'Д6',   price: 15,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: '2Д6'   },
  { id: 'smg',             name: 'Пистолет-пулемёт',       range: 'Д6',   power: '2Д6',  price: 25,  isHeavy: false, macedonianRange: '2Д6-1', macedonianPower: '3Д6'   },
  { id: 'shotgun',         name: 'Дробовик',               range: 'Д6',   power: '3Д6',  price: 35,  isHeavy: false },
  { id: 'assault_rifle',   name: 'Автомат',                range: 'Д12',  power: '2Д6',  price: 40,  isHeavy: false },
  { id: 'carbine',         name: 'Штурмовой карабин',      range: 'Д6',   power: 'Д12',  price: 45,  isHeavy: false },
  { id: 'sniper',          name: 'Снайперская Винтовка',   range: 'Д12+2',power: 'Д12',  price: 80,  isHeavy: false },
  { id: 'lmg',             name: 'Пулемёт',                range: 'Д12',  power: '2Д12', price: 100, isHeavy: true  },
  { id: 'rocket_launcher', name: 'Гранатомёт/ракетница',   range: 'Д12',  power: 'Д20',  price: 100, isHeavy: true  },
  { id: 'atr',             name: 'Противотанокое ружьё',   range: 'Д20',  power: 'Д12',  price: 80,  isHeavy: true  },
  { id: 'flamethrower',    name: 'Огнемёт',                range: 'Д6',   power: 'Д20',  price: 85,  isHeavy: true  },
  { id: 'laser_pistol',    name: 'ЛазПистолет',            range: '2Д6',  power: 'Д6+1', price: 30,  isHeavy: false, macedonianRange: '2Д6-1', macedonianPower: 'Д6+1'  },
  { id: 'laser_rifle',     name: 'ЛазГан',                 range: '2Д12', power: 'Д6+1', price: 60,  isHeavy: false },
  { id: 'laser_cannon',    name: 'ЛазПушка',               range: '2Д12', power: 'Д20',  price: 120, isHeavy: true  },
  { id: 'plasma_pistol',   name: 'ПлазПистолет',           range: 'Д6',   power: 'Д6+3', price: 45,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: 'Д6+3'  },
  { id: 'plasma_rifle',    name: 'ПлазГан',                range: 'Д12',  power: 'Д6+3', price: 60,  isHeavy: false },
  { id: 'plasma_cannon',   name: 'ПлазПушка',              range: 'Д12',  power: 'Д20+2',price: 120, isHeavy: true  },
  { id: 'gluon_pistol',    name: 'Глюонный пистолет',      range: 'Д6',   power: '2Д6+3',price: 55,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: '2Д6+3' },
  { id: 'gluon_rifle',     name: 'Глюонная винтовка',      range: 'Д12',  power: '3Д6+3',price: 80,  isHeavy: false },
  { id: 'gluon_cannon',    name: 'Глюонная пушка',         range: 'Д12',  power: 'Д12+2',price: 80,  isHeavy: true  },
];

export const MELEE_WEAPONS: MeleeWeaponDef[] = [
  { id: 'unarmed',       name: 'Без оружия',           price: 0  },
  { id: 'knife',         name: 'Нож',                  price: 10 },
  { id: 'cold_weapon',   name: 'Холодное оружие',      price: 15 },
  { id: 'saw_electro',   name: 'Пило/Электро',         price: 20 },
  { id: 'two_handed',    name: 'Двуручное оружие ББ',  price: 25 },
  { id: 'heavy_ranged',  name: 'Тяжёлое стрелковое',   price: 0  },
];

export const PROPERTIES: PropertyDef[] = [
  { id: 'mechanic',      name: 'Рм',  price: 10 },
  { id: 'jump_boost_3',  name: 'Пр3', price: 20 },
  { id: 'jump_boost_4',  name: 'Пр4', price: 30 },
  { id: 'jump_boost_5',  name: 'Пр5', price: 40 },
];
