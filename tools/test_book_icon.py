#!/usr/bin/env python3
"""Test the encyclopedia modal (book icon) in unit cards."""

from playwright.sync_api import sync_playwright
import time

def test_encyclopedia_modal():
    """Test clicking the book icon and checking if modal shows encyclopedia data."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        page.goto('http://localhost:3001/app')
        page.wait_for_load_state('networkidle')

        # Take initial screenshot
        page.screenshot(path='/tmp/01-initial.png')
        print("Screenshot saved: /tmp/01-initial.png")

        # Click through the flow: Rules -> Source -> Faction -> Budget
        print("\n=== Step 1: Rules confirmation ===")
        page.click('[data-testid="rules-confirm-button"]')
        page.wait_for_timeout(500)
        page.screenshot(path='/tmp/02-after-rules.png')
        print("Screenshot saved: /tmp/02-after-rules.png")

        print("\n=== Step 2: Source selection ===")
        page.click('[data-testid="source-confirm-button"]')
        page.wait_for_timeout(500)
        page.screenshot(path='/tmp/03-after-source.png')
        print("Screenshot saved: /tmp/03-after-source.png")

        print("\n=== Step 3: Faction selection ===")
        page.click('[data-testid="faction-card-polaris"]')
        page.wait_for_timeout(300)
        page.screenshot(path='/tmp/04-faction-selected.png')
        print("Screenshot saved: /tmp/04-faction-selected.png")

        page.click('[data-testid="faction-continue-button"]')
        page.wait_for_timeout(500)
        page.screenshot(path='/tmp/05-after-faction.png')
        print("Screenshot saved: /tmp/05-after-faction.png")

        print("\n=== Step 4: Budget selection ===")
        page.click('button:has-text("350")')
        page.wait_for_timeout(300)
        page.click('[data-testid="budget-next-button"]')
        page.wait_for_timeout(500)
        page.screenshot(path='/tmp/06-unit-selector.png')
        print("Screenshot saved: /tmp/06-unit-selector.png")

        # Add a unit to the army
        print("\n=== Step 5: Add unit to army ===")
        page.click('[data-testid="unit-card-polaris_lineynaya_klon_pehota"]')
        page.wait_for_timeout(300)
        page.screenshot(path='/tmp/07-unit-added.png')
        print("Screenshot saved: /tmp/07-unit-added.png")

        # Click "To Battle" button
        print("\n=== Step 6: Go to battle preparation ===")
        page.click('[data-testid="to-battle-button"]')
        page.wait_for_timeout(500)
        page.screenshot(path='/tmp/08-battle-prep.png')
        print("Screenshot saved: /tmp/08-battle-prep.png")

        # Click start battle
        print("\n=== Step 7: Start battle ===")
        page.click('[data-testid="start-battle-button"]')
        page.wait_for_timeout(500)
        page.screenshot(path='/tmp/09-game-session.png')
        print("Screenshot saved: /tmp/09-game-session.png")

        # Find and click the book icon on a unit card
        print("\n=== Step 8: Click book icon ===")

        # Look for book icon button
        book_buttons = page.locator('button[aria-label="Открыть энциклопедию"]')
        count = book_buttons.count()
        print(f"Found {count} book icon buttons")

        if count > 0:
            # Take screenshot before clicking
            page.screenshot(path='/tmp/10-before-book-click.png')
            print("Screenshot saved: /tmp/10-before-book-click.png")

            # Click the first book icon
            book_buttons.first.click()
            page.wait_for_timeout(500)

            # Take screenshot after clicking
            page.screenshot(path='/tmp/11-after-book-click.png')
            print("Screenshot saved: /tmp/11-after-book-click.png")

            # Check if modal is visible
            modal_visible = page.locator('text=DATA_LORE').count() > 0
            print(f"\n=== RESULT ===")
            print(f"DATA_LORE visible: {modal_visible}")

            if modal_visible:
                print("✅ Encyclopedia modal IS showing lore content!")

                # Check for other sections
                tactics = page.locator('text=DATA_TACTICS').count() > 0
                history = page.locator('text=DATA_HISTORY').count() > 0
                traditions = page.locator('text=DATA_TRADITIONS').count() > 0

                print(f"DATA_TACTICS visible: {tactics}")
                print(f"DATA_HISTORY visible: {history}")
                print(f"DATA_TRADITIONS visible: {traditions}")
            else:
                print("❌ Encyclopedia modal is NOT showing lore content")

                # Get page content for debugging
                content = page.content()
                print(f"\nModal content length: {len(content)}")

                # Look for encyclopedia in content
                if 'encyclopedia' in content.lower():
                    print("Found 'encyclopedia' in page content")
                if 'lore' in content.lower():
                    print("Found 'lore' in page content")
        else:
            print("❌ No book icon buttons found!")
            page.screenshot(path='/tmp/10-no-book-icon.png')
            print("Screenshot saved: /tmp/10-no-book-icon.png")

        # Wait before closing
        print("\nWaiting 5 seconds before closing...")
        time.sleep(5)

        browser.close()

if __name__ == '__main__':
    test_encyclopedia_modal()
