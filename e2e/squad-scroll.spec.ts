import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad } from './helpers/setup';

/**
 * Squad Scroll E2E tests
 *
 * Regression test for the bug where, in battle mode, a 6-soldier squad did not
 * fit on screen: the last soldier was half-hidden behind the bottom dock and
 * the squad area did not scroll.
 *
 * Root cause: the bounded viewport height never reached the `overflow-y-auto`
 * container. The wrapper around <UnitCard> and the UnitCard root itself had no
 * height bound, so the scroll container grew to its natural (full) content
 * height — producing no internal overflow and therefore no scrollbar. The
 * ancestor `overflow-hidden` clipped the 6th soldier, and the fixed bottom dock
 * covered it.
 *
 * Fix: restore the flex height chain so the scroll container is bounded
 * (wrapper + UnitCard root get a bounded height; the squad content uses
 * flex-1 + overflow-y-auto — the same idiom used by the combat modal and the
 * expanded navigator).
 */
test.describe('Squad scroll in battle view', () => {
  // Mobile-first: a small portrait viewport guarantees the 6-soldier squad
  // overflows the area above the bottom dock.
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    // setupGameSessionWithSquad creates a single 6-soldier squad by default,
    // which becomes the focused unit shown by <UnitCard> in the battle view.
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'squad-scroll-unit-1' },
    });
  });

  test('squad area scrolls so the full 6-soldier squad is reachable', async ({ page }) => {
    const scrollArea = page.getByTestId('squad-scroll');
    await expect(scrollArea).toBeVisible();

    // A properly bounded scroll container is shorter than its content when the
    // squad overflows the viewport. Before the fix this container was unbounded
    // (clientHeight === scrollHeight) and the last soldier stayed clipped.
    const isScrollable = await scrollArea.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(isScrollable).toBe(true);

    // Scrolling to the bottom must actually move the content — proving the last
    // soldier can be brought into view rather than being permanently hidden.
    const scrolled = await scrollArea.evaluate((el) => {
      const before = el.scrollTop;
      el.scrollTop = el.scrollHeight;
      return el.scrollTop > before;
    });
    expect(scrolled).toBe(true);
  });
});
