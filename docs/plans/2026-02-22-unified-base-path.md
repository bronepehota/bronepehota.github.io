# Unified BASE_PATH Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify BASE_PATH handling across all components to fix images on GitHub Pages

**Architecture:** Single source of truth in constants.ts, all components import from there

**Tech Stack:** TypeScript, React, Next.js static export

---

### Task 1: Add BASE_PATH to constants.ts

**Files:**
- Modify: `src/lib/constants.ts`

**Step 1: Add BASE_PATH export**

Add this line after the existing constants in `src/lib/constants.ts`:

```typescript
// Base path for GitHub Pages deployment
export const BASE_PATH = process.env.GITHUB_PAGES === 'true' ? '/bronepehota' : '';
```

**Step 2: Verify the file compiles**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add unified BASE_PATH constant"
```

---

### Task 2: Update UnitNavigationCard to use centralized BASE_PATH

**Files:**
- Modify: `src/components/GameSession/UnitNavigationCard.tsx`

**Step 1: Remove local BASE_PATH and add import**

Replace the local BASE_PATH definition (lines 8-9):
```typescript
// Remove these lines:
// Use basePath only in production, empty in development
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/bronepehota' : '';
```

Add import at the top with other imports (after line 4):
```typescript
import { BASE_PATH } from '@/lib/constants';
```

**Step 2: Verify the changes**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/GameSession/UnitNavigationCard.tsx
git commit -m "refactor: use centralized BASE_PATH in UnitNavigationCard"
```

---

### Task 3: Update GitHubPagesImage to use centralized BASE_PATH

**Files:**
- Modify: `src/components/GitHubPagesImage.tsx`

**Step 1: Remove local BASE_PATH and add import**

Replace the local BASE_PATH definition (lines 5-6):
```typescript
// Remove these lines:
// // Use basePath only when GITHUB_PAGES env var is set (for GitHub Pages deployment)
// const BASE_PATH = process.env.GITHUB_PAGES === 'true' ? '/bronepehota' : '';
```

Add import at the top (after line 3):
```typescript
import { BASE_PATH } from '@/lib/constants';
```

**Step 2: Verify the changes**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/GitHubPagesImage.tsx
git commit -m "refactor: use centralized BASE_PATH in GitHubPagesImage"
```

---

### Task 4: Add unit test for BASE_PATH

**Files:**
- Modify: `src/__tests__/lib/constants.test.ts`

**Step 1: Add BASE_PATH test case**

Add this test to the existing test file:

```typescript
describe('BASE_PATH', () => {
  it('should be empty when GITHUB_PAGES is not set', () => {
    // In test environment, GITHUB_PAGES is not set
    const { BASE_PATH } = require('@/lib/constants');
    expect(BASE_PATH).toBe('');
  });

  it('should contain /bronepehota when GITHUB_PAGES is true', () => {
    // Set env var before importing
    process.env.GITHUB_PAGES = 'true';
    // Clear require cache to re-import with new env
    jest.resetModules();
    const { BASE_PATH } = require('@/lib/constants');
    expect(BASE_PATH).toBe('/bronepehota');
    // Clean up
    delete process.env.GITHUB_PAGES;
    jest.resetModules();
  });
});
```

**Step 2: Run the test**

Run: `npm test -- src/__tests__/lib/constants.test.ts`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/__tests__/lib/constants.test.ts
git commit -m "test: add BASE_PATH unit tests"
```

---

### Task 5: Verify with E2E tests

**Step 1: Run E2E tests**

Run: `npm run test:e2e`
Expected: All 34 tests pass

**Step 2: Run all validation**

Run: `npm run validate`
Expected: Type check, lint, and unit tests all pass

---

### Task 6: Final commit and summary

**Step 1: Check the diff**

Run: `git diff main --stat`
Expected: Shows changes in constants.ts, UnitNavigationCard.tsx, GitHubPagesImage.tsx, and test file

**Step 2: Create summary commit**

```bash
git add docs/plans/2026-02-22-unified-base-path-design.md
git commit -m "docs: add unified BASE_PATH design and implementation plan"
```

**Step 3: Show final summary**

```bash
git log --oneline -5
```
