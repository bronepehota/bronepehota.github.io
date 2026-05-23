# Promo VK/Telegram Post — Design Spec

## Goal

Create a promotional post for VK/Telegram targeting existing Bronepehota players. The post highlights the app as a digital card database that works alongside physical dice — not a replacement for them.

## Target Audience

Existing players who already know Bronepehota rules. Tone: informal Russian, direct, no marketing fluff.

## Key Message

**Приложение не заменяет кубики — оно заменяет бумажки.** Кидаешь кубики руками, а приложение держит карточки, считает состояние и запоминает модификаторы.

## Post Structure

### 1. Header

Short punchy title about a digital assistant for Bronepehota.

### 2. Introduction (2-3 sentences)

What the app is and why a player needs it. Straight to the point.

### 3. Feature Blocks (4 blocks, each = screenshot + 3-5 sentences)

**Block 1: Army Builder (Сбор армии)**
- Faction selection, budget, adding squads/machines
- Auto-save in browser
- Screenshot: assembled army view

**Block 2: Card Navigator (Навигатор по карточкам)**
- Digital card database during battle
- Quick access to unit stats (range, power, armor)
- Tracking state: durability, ammo, losses
- Key emphasis: play with physical dice, use the app as your card base
- Screenshot: game session with ExpandedNavigator

**Block 3: In-Combat Calculator (Боевой калькулятор)**
- Automatic calculation with unit parameters
- Modifiers: buffs, debuffs, abilities — app remembers them all
- No need to keep track in your head
- Screenshot: combat modal with active modifiers displayed

**Block 4: Standalone Calculator (Отдельный калькулятор)**
- Manual parameter input
- Calculate any hypothetical engagement
- Dice notation support (D6, D12, D20)
- Screenshot: standalone calculator page

### 4. Call to Action

Link to the app + link to GitHub repository.

## Screenshots (6 total, Playwright, 375px mobile viewport)

| # | Screen | File |
|---|--------|------|
| 1 | Landing page | `docs/promo/screenshots/01-landing.png` |
| 2 | Army builder | `docs/promo/screenshots/02-army.png` |
| 3 | Card navigator (game session) | `docs/promo/screenshots/03-navigator.png` |
| 4 | Combat with modifiers | `docs/promo/screenshots/04-combat-modifiers.png` |
| 5 | Standalone calculator | `docs/promo/screenshots/05-calculator.png` |
| 6 | Encyclopedia | `docs/promo/screenshots/06-encyclopedia.png` |

## Output Files

- `docs/promo/vk-telegram-post.md` — post text with screenshot placeholders
- `docs/promo/screenshots/` — 6 Playwright screenshots (375px mobile viewport)

## Style Guidelines

- Russian language, informal (ты, not вы)
- No marketing buzzwords — concrete benefits only
- Emojis as section markers, not overused
- Short paragraphs for mobile readability
