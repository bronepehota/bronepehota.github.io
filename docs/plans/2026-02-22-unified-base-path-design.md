# Unified BASE_PATH Design

## Problem

After fixing navigation images with a local `BASE_PATH` in `UnitNavigationCard`, other images broke on GitHub Pages. The issue was inconsistent BASE_PATH handling:
- `UnitNavigationCard` used `NODE_ENV === 'production'`
- `GitHubPagesImage` used `GITHUB_PAGES === 'true'`

This caused a mismatch where navigation worked but other images didn't.

## Solution

Create a single source of truth for BASE_PATH in `constants.ts`.

## Architecture

**BASE_PATH Definition** (`src/lib/constants.ts`):
```typescript
export const BASE_PATH = process.env.GITHUB_PAGES === 'true' ? '/bronepehota' : '';
```

**Usage Pattern**:
```typescript
import { BASE_PATH } from '@/lib/constants';

const finalSrc = imagePath.startsWith('/images/')
  ? `${BASE_PATH}${imagePath}`
  : imagePath;
```

## Components to Update

1. **constants.ts** - Add BASE_PATH export
2. **UnitNavigationCard.tsx** - Remove local BASE_PATH, import from constants
3. **GitHubPagesImage.tsx** - Import BASE_PATH from constants

## Data Flow

```
constants.ts exports BASE_PATH
     ↓
GitHubPagesImage uses BASE_PATH
UnitNavigationCard uses BASE_PATH
Future components use BASE_PATH
     ↓
Images work correctly on GitHub Pages
```

## Error Handling

- TypeScript ensures correct usage
- Paths starting with `/images/` get BASE_PATH prefix
- Standard browser fallback for broken images

## Testing

1. Unit tests verify BASE_PATH value
2. E2E tests verify image display
3. Manual testing on GitHub Pages
