# Design: Squad Lore Expansion

**Date:** 2026-03-09
**Status:** Approved
**Author:** Claude Code

## Overview

Add depth to the existing squad lore by expanding encyclopedia entries with three new fields:
- `traditions` - Cultural practices, rituals, and internal traditions
- `keyBattles` - Famous battles and exploits
- `locations` - Important places connected to the squad

## Data Structure Changes

### New Fields in `encyclopedia` object

```typescript
interface Encyclopedia {
  class: string;
  lore: string;           // existing - basic description
  tactics: string;        // existing - gameplay advice
  history: string;        // existing - creation history (expandable)
  manufacturer: string;   // existing - creator

  // NEW FIELDS:
  traditions?: string;    // Cultural practices, rituals, traditions
  keyBattles?: KeyBattle[];
  locations?: Location[];
}

interface KeyBattle {
  name: string;
  year: string;
  description: string;
  outcome: string;
}

interface Location {
  name: string;
  type: 'base' | 'academy' | 'battlefield' | 'homeworld';
  description: string;
}
```

## Content Creation Guidelines

### Faction Tone & Style

**Polaris (Imperial)**
- Tone: Authoritarian, loyal, militaristic, disciplined
- Keywords: Император, честь, долг, Sacrifice, hierarchy
- Style: Formal, reverent, emphasizing service to the Emperor

**Protectorate (Corporate)**
- Tone: Professional, technocratic, efficient, progressive
- Keywords: Инновации, стандартизация, cybernetics, trade
- Style: Corporate, analytical, emphasizing technological superiority

**Mercenaries (Freelance)**
- Tone: Pragmatic, cynical, survivalist, independent
- Keywords: Credits, survival, reputation, freedom
- Style: Rough, informal, emphasizing practical results

### Content Priorities

#### Priority 1: Elite Units (high-cost squads)
- Polaris: Трибунаторы (165/170 pts), Спецназ Шиду (90 pts)
- Protectorate: Киберспецназ (135 pts), Стервятники (125 pts)
- Mercenaries: Найтсталкеры (95 pts)

#### Priority 2: Unique/memorable units
- Polaris: Штурмовой десант (95/105 pts)
- Protectorate: Спецназ Фелиции (135 pts), Киберпехота (105 pts)
- Mercenaries: Пираты Маркуса (50/80 pts)

#### Priority 3: Basic units (fill out roster)
- Remaining squads across all factions

## Implementation Phases

### Phase 1: Sample Squad (Proof of Concept)
Create enhanced lore for 1 squad per faction as template:
- Polaris: Трибунаторы (новые)
- Protectorate: Киберспецназ
- Mercenaries: Найтсталкеры

### Phase 2: Priority Units
Enhance lore for remaining high-cost and elite units.

### Phase 3: Standard Units
Complete lore for all remaining squads.

### Phase 4: Machine Units
Apply same structure to machine/vehicle units.

## UI Updates Required

1. **EncyclopediaModal** - Display new fields
2. **UnitLore component** - Show traditions, battles, locations
3. **Encyclopedia detail pages** - Render new content

## Examples

### Example: Polaris Tribunators

```json
{
  "encyclopedia": {
    "class": "Элитная гвардия",
    "lore": "Личная гвардия Императора...",
    "tactics": "Элитная гвардия...",
    "history": "Изначально личная гвардия...",
    "manufacturer": "Имперская Гвардия",

    "traditions": "Каждый трибунатор проходит Ритуал Крови на алтаре Императора. Нельзя отступить, пока жив командир. Смерть в бою считается высшей честью. Щит трибунатора никогда не покидает владельца — даже после смерти.",
    "keyBattles": [
      {
        "name": "Осада крепости Саруков",
        "year": "Эпоха Consolidation",
        "description": "300 трибунаторов удерживали крепость против 10,000 повстанцев в течение 40 дней.",
        "outcome": "Полная победа, укрепление репутации неприступности"
      },
      {
        "name": "Битва при Небесном Вороте",
        "year": "Эпоха Expansion",
        "description": "Первая десантная операция трибунаторов. Захватили орбитальную станцию ценой 80% потерь.",
        "outcome": "Захват ключевого стратегического объекта"
      }
    ],
    "locations": [
      {
        "name": "Академия Трибунов, планета Полярис Prime",
        "type": "academy",
        "description": "Тренировочный комплекс в кратере потухшего вулкана. Только 1 из 100 кандидатов заканчивает обучение."
      },
      {
        "name": "Дворец Императора",
        "type": "base",
        "description": "Постоянная дислокация личной гвардии. Трибунаторы никогда не покидают столицу без прямого приказа Императора."
      }
    ]
  }
}
```

## Success Criteria

- [ ] All 32 squads have enhanced lore with new fields
- [ ] Content is thematically consistent within each faction
- [ ] Cross-references between squads (shared battles, locations)
- [ ] UI properly displays all new fields
- [ ] No generic AI-sounding text — each squad feels unique
- [ ] Russian language quality is high and immersive

## Notes

- Current lore was AI-generated — aim for more unique, characterful content
- Use cross-squad references to build cohesive world
- Keep game balance in mind — lore should support gameplay roles
- Don't contradict existing stats/tactical descriptions
