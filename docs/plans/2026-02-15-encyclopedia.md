# Энциклопедия Бронепехоты - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Создать энциклопедию отрядов и техники на отдельном URL с фильтрацией, поиском и детальными страницами

**Architecture:** Next.js App Router со статической генерацией (Static Generation). Все страницы генерируются при сборке через `generateStaticParams`. Данные хранятся в JSON-файлах с новым полем `encyclopedia`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Playwright (E2E tests)

---

## Task 1: Обновить типы для encyclopedia поля

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add EncyclopediaData interface**

```typescript
// Добавить после существующих интерфейсов
interface EncyclopediaData {
  class?: string;
  lore?: string;
  tactics?: string;
  history?: string;
  manufacturer?: string;
  sourceUrl?: string;
}
```

**Step 2: Update Squad interface to include encyclopedia**

```typescript
// Найти interface Squad и добавить поле encyclopedia
interface Squad {
  id: string;
  name: string;
  shortName: string;
  faction: FactionID;
  cost: number;
  encyclopedia?: EncyclopediaData;  // <-- ADD THIS
  soldiers: Soldier[];
}
```

**Step 3: Update Machine interface to include encyclopedia**

```typescript
// Найти interface Machine и добавить поле encyclopedia
interface Machine {
  // ... existing fields ...
  encyclopedia?: EncyclopediaData;  // <-- ADD THIS
  speed_sectors: SpeedSector[];
  weapons: Weapon[];
}
```

**Step 4: Run type check**

```bash
npm run type-check
```
Expected: No errors (types are optional so existing data still works)

**Step 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add EncyclopediaData interface and update Squad/Machine types"
```

---

## Task 2: Создать утилиты для работы с данными энциклопедии

**Files:**
- Create: `src/lib/encyclopedia-utils.ts`
- Test: `src/__tests__/encyclopedia-utils.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/__tests__/encyclopedia-utils.test.ts
import { getAllUnits, getUnitById, filterUnits, UnitWithType } from '@/lib/encyclopedia-utils';

describe('encyclopedia-utils', () => {
  describe('getAllUnits', () => {
    it('returns all squads and machines with type field', async () => {
      const units = await getAllUnits();

      expect(units.length).toBeGreaterThan(0);
      expect(units.every(u => u.type === 'squad' || u.type === 'machine')).toBe(true);
    });

    it('includes units from all factions', async () => {
      const units = await getAllUnits();
      const factions = new Set(units.map(u => u.faction));

      expect(factions.has('polaris')).toBe(true);
      expect(factions.has('protectorate')).toBe(true);
      expect(factions.has('mercenaries')).toBe(true);
    });
  });

  describe('getUnitById', () => {
    it('returns squad by id', async () => {
      const unit = await getUnitById('polaris_lineynaya_klon_pehota');

      expect(unit).toBeDefined();
      expect(unit?.id).toBe('polaris_lineynaya_klon_pehota');
      expect(unit?.type).toBe('squad');
    });

    it('returns machine by id', async () => {
      const unit = await getUnitById('demolisher');

      expect(unit).toBeDefined();
      expect(unit?.id).toBe('demolisher');
      expect(unit?.type).toBe('machine');
    });

    it('returns null for non-existent id', async () => {
      const unit = await getUnitById('non_existent_id');

      expect(unit).toBeNull();
    });
  });

  describe('filterUnits', () => {
    it('filters by faction', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { faction: 'polaris' });

      expect(filtered.every(u => u.faction === 'polaris')).toBe(true);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('filters by type', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { type: 'squad' });

      expect(filtered.every(u => u.type === 'squad')).toBe(true);
    });

    it('filters by class from encyclopedia', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { class: 'Линейная пехота' });

      expect(filtered.every(u => u.encyclopedia?.class === 'Линейная пехота')).toBe(true);
    });

    it('searches by name (case insensitive)', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { search: 'клон' });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(u =>
        u.name.toLowerCase().includes('клон') ||
        u.shortName.toLowerCase().includes('клон')
      )).toBe(true);
    });

    it('combines multiple filters', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, {
        faction: 'polaris',
        type: 'squad'
      });

      expect(filtered.every(u => u.faction === 'polaris' && u.type === 'squad')).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- encyclopedia-utils.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/encyclopedia-utils'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/encyclopedia-utils.ts
import { Squad, Machine, FactionID } from './types';

export type UnitWithType = (Squad | Machine) & { type: 'squad' | 'machine' };

export interface FilterOptions {
  faction?: FactionID;
  type?: 'squad' | 'machine';
  class?: string;
  search?: string;
}

async function loadSquads(faction: string): Promise<Squad[]> {
  const data = await import(`@/data/${faction}/squads.json`);
  return data.default;
}

async function loadMachines(faction: string): Promise<Machine[]> {
  const data = await import(`@/data/${faction}/machines.json`);
  return data.default;
}

export async function getAllUnits(): Promise<UnitWithType[]> {
  const factions: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];
  const units: UnitWithType[] = [];

  for (const faction of factions) {
    const squads = await loadSquads(faction);
    const machines = await loadMachines(faction);

    units.push(
      ...squads.map(s => ({ ...s, type: 'squad' as const })),
      ...machines.map(m => ({ ...m, type: 'machine' as const }))
    );
  }

  return units;
}

export async function getUnitById(id: string): Promise<UnitWithType | null> {
  const units = await getAllUnits();
  return units.find(u => u.id === id) || null;
}

export function filterUnits(units: UnitWithType[], options: FilterOptions): UnitWithType[] {
  return units.filter(unit => {
    // Faction filter
    if (options.faction && unit.faction !== options.faction) {
      return false;
    }

    // Type filter
    if (options.type && unit.type !== options.type) {
      return false;
    }

    // Class filter (from encyclopedia)
    if (options.class && unit.encyclopedia?.class !== options.class) {
      return false;
    }

    // Search filter (name or shortName, case insensitive)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const nameMatch = unit.name.toLowerCase().includes(searchLower);
      const shortNameMatch = unit.shortName.toLowerCase().includes(searchLower);
      if (!nameMatch && !shortNameMatch) {
        return false;
      }
    }

    return true;
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- encyclopedia-utils.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/encyclopedia-utils.ts src/__tests__/encyclopedia-utils.test.ts
git commit -m "feat(encyclopedia): add utility functions for data management"
```

---

## Task 3: Создать компоненты UI - UnitCard

**Files:**
- Create: `src/components/encyclopedia/UnitCard.tsx`

**Step 1: Create UnitCard component**

```typescript
// src/components/encyclopedia/UnitCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { UnitWithType } from '@/lib/encyclopedia-utils';

interface UnitCardProps {
  unit: UnitWithType;
}

const factionColors = {
  polaris: 'bg-red-500',
  protectorate: 'bg-blue-500',
  mercenaries: 'bg-green-500',
};

export function UnitCard({ unit }: UnitCardProps) {
  const factionColor = factionColors[unit.faction];

  return (
    <Link
      href={`/encyclopedia/unit/${unit.id}`}
      className="block bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-700 transition-colors"
    >
      <div className="relative aspect-[3/4] w-full">
        <Image
          src={unit.image}
          alt={unit.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${factionColor}`}>
            {unit.faction === 'polaris' && 'Полярис'}
            {unit.faction === 'protectorate' && 'Протекторат'}
            {unit.faction === 'mercenaries' && 'Наёмники'}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white text-sm mb-1">{unit.name}</h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{unit.encyclopedia?.class || (unit.type === 'squad' ? 'Отряд' : 'Машина')}</span>
          <span>{unit.cost} очков</span>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/encyclopedia/UnitCard.tsx
git commit -m "feat(encyclopedia): add UnitCard component"
```

---

## Task 4: Создать компоненты UI - FilterBar и SearchInput

**Files:**
- Create: `src/components/encyclopedia/FilterBar.tsx`
- Create: `src/components/encyclopedia/SearchInput.tsx`

**Step 1: Create FilterBar component**

```typescript
// src/components/encyclopedia/FilterBar.tsx
import { FactionID } from '@/lib/types';

interface FilterBarProps {
  selectedFaction: FactionID | 'all';
  selectedType: 'all' | 'squad' | 'machine';
  onFactionChange: (faction: FactionID | 'all') => void;
  onTypeChange: (type: 'all' | 'squad' | 'machine') => void;
}

const factions: { value: FactionID | 'all'; label: string }[] = [
  { value: 'all', label: 'Все фракции' },
  { value: 'polaris', label: 'Империя Полярис' },
  { value: 'protectorate', label: 'Торговый Протекторат' },
  { value: 'mercenaries', label: 'Наёмники' },
];

const types: { value: 'all' | 'squad' | 'machine'; label: string }[] = [
  { value: 'all', label: 'Все типы' },
  { value: 'squad', label: 'Пехота' },
  { value: 'machine', label: 'Техника' },
];

export function FilterBar({
  selectedFaction,
  selectedType,
  onFactionChange,
  onTypeChange
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Faction filter */}
      <div className="flex gap-1">
        {factions.map(faction => (
          <button
            key={faction.value}
            onClick={() => onFactionChange(faction.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFaction === faction.value
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {faction.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-1">
        {types.map(type => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === type.value
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create SearchInput component**

```typescript
// src/components/encyclopedia/SearchInput.tsx
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск по названию..."
        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
      />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/encyclopedia/FilterBar.tsx src/components/encyclopedia/SearchInput.tsx
git commit -m "feat(encyclopedia): add FilterBar and SearchInput components"
```

---

## Task 5: Создать компоненты UI - UnitGrid

**Files:**
- Create: `src/components/encyclopedia/UnitGrid.tsx`

**Step 1: Create UnitGrid component**

```typescript
// src/components/encyclopedia/UnitGrid.tsx
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { UnitCard } from './UnitCard';

interface UnitGridProps {
  units: UnitWithType[];
}

export function UnitGrid({ units }: UnitGridProps) {
  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">Ничего не найдено</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {units.map(unit => (
        <UnitCard key={unit.id} unit={unit} />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/encyclopedia/UnitGrid.tsx
git commit -m "feat(encyclopedia): add UnitGrid component"
```

---

## Task 6: Создать главную страницу энциклопедии

**Files:**
- Create: `src/app/encyclopedia/page.tsx`

**Step 1: Create encyclopedia page**

```typescript
// src/app/encyclopedia/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getAllUnits, filterUnits, UnitWithType } from '@/lib/encyclopedia-utils';
import { FactionID } from '@/lib/types';
import { FilterBar } from '@/components/encyclopedia/FilterBar';
import { SearchInput } from '@/components/encyclopedia/SearchInput';
import { UnitGrid } from '@/components/encyclopedia/UnitGrid';

export default function EncyclopediaPage() {
  const [units, setUnits] = useState<UnitWithType[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitWithType[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<FactionID | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'squad' | 'machine'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllUnits().then(data => {
      setUnits(data);
      setFilteredUnits(data);
    });
  }, []);

  useEffect(() => {
    const filtered = filterUnits(units, {
      faction: selectedFaction,
      type: selectedType,
      search: searchQuery || undefined,
    });
    setFilteredUnits(filtered);
  }, [units, selectedFaction, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Энциклопедия</h1>

        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <FilterBar
          selectedFaction={selectedFaction}
          selectedType={selectedType}
          onFactionChange={setSelectedFaction}
          onTypeChange={setSelectedType}
        />

        <UnitGrid units={filteredUnits} />
      </div>
    </div>
  );
}
```

**Step 2: Add metadata**

```typescript
// Добавить перед export default
export const metadata = {
  title: 'Энциклопедия — Бронепехота',
  description: 'Полный справочник по отрядам и технике Бронепехоты',
};
```

**Step 3: Commit**

```bash
git add src/app/encyclopedia/page.tsx
git commit -m "feat(encyclopedia): add main encyclopedia page with filters"
```

---

## Task 7: Создать детальную страницу отряда - компоненты

**Files:**
- Create: `src/components/encyclopedia/UnitDetail/UnitHeader.tsx`
- Create: `src/components/encyclopedia/UnitDetail/UnitStats.tsx`
- Create: `src/components/encyclopedia/UnitDetail/UnitLore.tsx`
- Create: `src/components/encyclopedia/UnitDetail/UnitTactics.tsx`
- Create: `src/components/encyclopedia/UnitDetail/SourceLink.tsx`

**Step 1: Create UnitHeader component**

```typescript
// src/components/encyclopedia/UnitDetail/UnitHeader.tsx
import Image from 'next/image';
import { UnitWithType } from '@/lib/encyclopedia-utils';

interface UnitHeaderProps {
  unit: UnitWithType;
}

const factionColors = {
  polaris: 'text-red-400',
  protectorate: 'text-blue-400',
  mercenaries: 'text-green-400',
};

const factionNames = {
  polaris: 'Империя Полярис',
  protectorate: 'Торговый Протекторат',
  mercenaries: 'Наёмники',
};

export function UnitHeader({ unit }: UnitHeaderProps) {
  const factionColor = factionColors[unit.faction];
  const factionName = factionNames[unit.faction];

  return (
    <div className="flex flex-col md:flex-row gap-6 mb-8">
      <div className="w-full md:w-1/3 relative aspect-[3/4] rounded-lg overflow-hidden">
        <Image
          src={unit.image}
          alt={unit.name}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex-1">
        <div className={`text-sm font-semibold ${factionColor} mb-2`}>
          {factionName}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{unit.name}</h1>
        {unit.encyclopedia?.class && (
          <div className="text-slate-400 mb-4">{unit.encyclopedia.class}</div>
        )}
        <div className="text-2xl font-bold text-slate-300">{unit.cost} очков</div>
      </div>
    </div>
  );
}
```

**Step 2: Create UnitStats component**

```typescript
// src/components/encyclopedia/UnitDetail/UnitStats.tsx
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Shield, Zap, Users, Wrench } from 'lucide-react';

interface UnitStatsProps {
  unit: UnitWithType;
}

export function UnitStats({ unit }: UnitStatsProps) {
  if (unit.type === 'squad') {
    return (
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Характеристики отряда</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem icon={<Users className="w-5 h-5" />} label="Солдат" value={unit.soldiers.length.toString()} />
          <StatItem icon={<Shield className="w-5 h-5" />} label="Броня" value={`${unit.soldiers[0]?.armor || '-'}`} />
          <StatItem icon={<Zap className="w-5 h-5" />} label="Скорость" value={`${unit.soldiers[0]?.speed || '-'}`} />
          <StatItem icon={<Wrench className="w-5 h-5" />} label="Ранг" value={`${unit.soldiers[0]?.rank || '-'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-bold text-white mb-4">Характеристики машины</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem icon={<Shield className="w-5 h-5" />} label="Прочность" value={unit.durability_max.toString()} />
        <StatItem icon={<Zap className="w-5 h-5" />} label="Скорость" value={getMaxSpeed(unit).toString()} />
        <StatItem icon={<Wrench className="w-5 h-5" />} label="Боекомплект" value={unit.ammo_max.toString()} />
        <StatItem icon={<Users className="w-5 h-5" />} label="Ранг" value={unit.rank.toString()} />
      </div>
      {unit.crew && <div className="text-slate-400 mt-2">Экипаж: {unit.crew}</div>}
      {unit.mass && <div className="text-slate-400">Масса: {unit.mass}</div>}
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-400">{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function getMaxSpeed(machine: any): number {
  return machine.speed_sectors?.[0]?.speed || 0;
}
```

**Step 3: Create UnitLore component**

```typescript
// src/components/encyclopedia/UnitDetail/UnitLore.tsx
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { BookOpen } from 'lucide-react';

interface UnitLoreProps {
  unit: UnitWithType;
}

export function UnitLore({ unit }: UnitLoreProps) {
  const hasContent = unit.encyclopedia?.lore || unit.encyclopedia?.history;

  if (!hasContent) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Лор и история
      </h2>

      {unit.encyclopedia?.lore && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Описание</h3>
          <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.lore}</p>
        </div>
      )}

      {unit.encyclopedia?.history && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">История создания</h3>
          <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.history}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create UnitTactics component**

```typescript
// src/components/encyclopedia/UnitDetail/UnitTactics.tsx
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Target } from 'lucide-react';

interface UnitTacticsProps {
  unit: UnitWithType;
}

export function UnitTactics({ unit }: UnitTacticsProps) {
  if (!unit.encyclopedia?.tactics) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Тактика использования
      </h2>
      <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.tactics}</p>
    </div>
  );
}
```

**Step 5: Create SourceLink component**

```typescript
// src/components/encyclopedia/UnitDetail/SourceLink.tsx
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { ExternalLink } from 'lucide-react';

interface SourceLinkProps {
  unit: UnitWithType;
}

export function SourceLink({ unit }: SourceLinkProps) {
  const sourceUrl = unit.encyclopedia?.sourceUrl || (unit.type === 'machine' ? unit.sourceUrl : null);

  if (!sourceUrl) return null;

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
    >
      <ExternalLink className="w-4 h-4" />
      Источник
    </a>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/encyclopedia/UnitDetail/
git commit -m "feat(encyclopedia): add detail page components (header, stats, lore, tactics)"
```

---

## Task 8: Создать детальную страницу отряда - страница

**Files:**
- Create: `src/app/encyclopedia/unit/[id]/page.tsx`

**Step 1: Create dynamic route page**

```typescript
// src/app/encyclopedia/unit/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUnitById, getAllUnits } from '@/lib/encyclopedia-utils';
import { UnitHeader } from '@/components/encyclopedia/UnitDetail/UnitHeader';
import { UnitStats } from '@/components/encyclopedia/UnitDetail/UnitStats';
import { UnitLore } from '@/components/encyclopedia/UnitDetail/UnitLore';
import { UnitTactics } from '@/components/encyclopedia/UnitDetail/UnitTactics';
import { SourceLink } from '@/components/encyclopedia/UnitDetail/SourceLink';

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const units = await getAllUnits();
  return units.map(unit => ({ id: unit.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const unit = await getUnitById(params.id);

  if (!unit) {
    return {
      title: 'Не найдено — Энциклопедия Бронепехота',
    };
  }

  return {
    title: `${unit.name} — Энциклопедия Бронепехота`,
    description: unit.encyclopedia?.lore || `Отряд ${unit.name} фракции ${unit.faction}`,
    openGraph: {
      images: [unit.image],
    },
  };
}

export default async function UnitDetailPage({ params }: PageProps) {
  const unit = await getUnitById(params.id);

  if (!unit) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <UnitHeader unit={unit} />
        <UnitStats unit={unit} />
        <UnitLore unit={unit} />
        <UnitTactics unit={unit} />
        <div className="mt-8">
          <SourceLink unit={unit} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create not-found page**

```typescript
// src/app/encyclopedia/unit/[id]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Отряд не найден</h1>
        <p className="text-slate-400 mb-8">Такого отряда не существует в энциклопедии</p>
        <Link
          href="/encyclopedia"
          className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Вернуться к энциклопедии
        </Link>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/encyclopedia/unit/[id]/
git commit -m "feat(encyclopedia): add unit detail page with dynamic routing"
```

---

## Task 9: Добавить навигацию на энциклопедию

**Files:**
- Modify: `src/app/app/page.tsx` (или где находится главная навигация)

**Step 1: Find navigation component**

```bash
# Найти где находится навигация/меню
grep -r "Штаб\|В Бой" src/app --include="*.tsx" | head -5
```

**Step 2: Add encyclopedia link to navigation**

Add link to encyclopedia in the main navigation (implementation depends on current nav structure):
```typescript
<Link href="/encyclopedia" className="...">
  Энциклопедия
</Link>
```

**Step 3: Commit**

```bash
git add src/app/app/page.tsx
git commit -m "feat(encyclopedia): add navigation link to encyclopedia"
```

---

## Task 10: Написать E2E тесты

**Files:**
- Create: `e2e/encyclopedia.spec.ts`

**Step 1: Write E2E tests**

```typescript
// e2e/encyclopedia.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Энциклопедия', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('отображает список всех отрядов', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const grid = page.getByTestId('unit-grid');
    await expect(grid).toBeVisible();

    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('фильтрация по фракции работает', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Выбрать фильтр "Империя Полярис"
    await page.click('button:has-text("Империя Полярис")');
    await page.waitForTimeout(200);

    // Проверить что все видимые отряды из Поляриса
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const firstCard = cards.first();
    await expect(firstCard).toContainText('Полярис');
  });

  test('фильтрация по типу работает', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Выбрать фильтр "Пехота"
    await page.click('button:has-text("Пехота")');
    await page.waitForTimeout(200);

    // Проверить что карточки отображаются
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('поиск по названию работает', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Ввести поисковый запрос
    await page.fill('input[placeholder*="Поиск"]', 'клон');
    await page.waitForTimeout(300);

    // Проверить результаты
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('детальная страница отряда открывается', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Кликнуть на первую карточку
    await page.locator('[href*="/encyclopedia/unit/"]').first().click();
    await page.waitForLoadState('networkidle');

    // Проверить URL и контент
    expect(page.url()).toMatch(/\/encyclopedia\/unit\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('детальная страница показывает характеристики', async ({ page }) => {
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    // Проверить наличие заголовка
    await expect(page.locator('h1')).toContainText('Линейная клон-пехота');

    // Проверить наличие секций
    await expect(page.locator('text=Характеристики')).toBeVisible();
  });

  test('несуществующий ID возвращает 404', async ({ page }) => {
    const response = await page.goto('/encyclopedia/unit/non_existent_id');
    expect(response?.status()).toBe(404);
  });
});
```

**Step 2: Add test-id to UnitGrid component**

Update `src/components/encyclopedia/UnitGrid.tsx`:
```typescript
export function UnitGrid({ units }: UnitGridProps) {
  // ... existing code ...
  return (
    <div className="..." data-testid="unit-grid">  {/* <-- ADD THIS */}
      {units.map(unit => (
        <UnitCard key={unit.id} unit={unit} />
      ))}
    </div>
  );
}
```

**Step 3: Run E2E tests**

```bash
npm run test:e2e -- encyclopedia.spec.ts
```

**Step 4: Commit**

```bash
git add e2e/encyclopedia.spec.ts src/components/encyclopedia/UnitGrid.tsx
git commit -m "test(encyclopedia): add E2E tests for encyclopedia feature"
```

---

## Task 11: Добавить начальные данные encyclopedia для Polaris

**Files:**
- Modify: `src/data/polaris/squads.json`
- Modify: `src/data/polaris/machines.json`

**Step 1: Add encyclopedia data to Polaris squads**

This is a manual step. Add `encyclopedia` field to each squad in `src/data/polaris/squads.json`. Example:

```json
{
  "id": "polaris_lineynaya_klon_pehota",
  "name": "Линейная клон-пехота",
  // ... existing fields ...
  "encyclopedia": {
    "class": "Линейная пехота",
    "lore": "Основная сила Империи Полярис. Массово производимые клоны обучены с рождения вести боевые действия.",
    "tactics": "Держите дистанцию и используйте численное преимущество. Эффективны против легкой техники.",
    "history": "Созданы после Войны Воссоединения как замена обычным призывникам.",
    "manufacturer": "Имперский Департамент Клонирования"
  },
  "soldiers": [...]
}
```

**Step 2: Verify type check**

```bash
npm run type-check
```

**Step 3: Run tests**

```bash
npm test
npm run test:e2e -- encyclopedia.spec.ts
```

**Step 4: Commit**

```bash
git add src/data/polaris/
git commit -m "feat(encyclopedia): add encyclopedia data for Polaris squads"
```

---

## Task 12: Валидация и финальная проверка

**Step 1: Run full test suite**

```bash
npm run validate
```

**Step 2: Build production**

```bash
npm run build
```

**Step 3: Manual testing checklist**

- [ ] Открыть `/encyclopedia` — все отряды отображаются
- [ ] Фильтр по фракции работает
- [ ] Фильтр по типу работает
- [ ] Поиск работает
- [ ] Детальная страница открывается
- [ ] SEO metadata корректна
- [ ] 404 для несуществующего ID
- [ ] Мобильная версия работает

**Step 4: Final commit**

```bash
git commit --allow-empty -m "feat(encyclopedia): complete encyclopedia feature - ready for review"
```

---

## Summary

После выполнения этого плана у вас будет:

1. **Типы** `EncyclopediaData` в `types.ts`
2. **Утилиты** для работы с данными в `encyclopedia-utils.ts`
3. **Компоненты UI** — карточки, фильтры, детальные страницы
4. **Страницы** — `/encyclopedia` и `/encyclopedia/unit/[id]`
5. **Тесты** — unit и E2E тесты
6. **Данные** — пример encyclopedia данных для Polaris

**Дальнейшие шаги (не в рамках этого плана):**
- Добавить encyclopedia данные для Protectorate и Mercenaries
- Найти лор для солдат на форуме Tehnolog
- Добавить weapon display для машин
- Добавить soldier cards для отрядов
