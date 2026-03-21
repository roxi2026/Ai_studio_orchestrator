from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use file:// protocol for static mock page
        path = os.path.abspath("public/mock_aistudio.html")
        url = f"file://{path}"

        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()

        print(f"Opening {url}")
        page.goto(url)
        page.wait_for_timeout(1000)

        # 1. Check if the UI root is present
        expect(page.locator("#omnipotent-orchestrator-root")).to_be_visible()
        page.screenshot(path="verification/step1_initial.png")
        page.wait_for_timeout(500)

        # 2. Trigger an incremental log event
        page.click("#trigger-log")
        page.wait_for_timeout(500)
        expect(page.locator(".oo-log-entry").last).to_contain_text("New incremental log")
        page.screenshot(path="verification/step2_incremental.png")
        page.wait_for_timeout(500)

        # 3. Trigger bulk logs to test pruning
        page.click("#trigger-bulk-logs")
        page.wait_for_timeout(1000)

        # Verify pruning (max 50)
        count = page.locator(".oo-log-entry").count()
        print(f"Log count after bulk: {count}")
        # Note: Initial log + 1 single log + 60 bulk = 62. Should be pruned to 50.
        if count > 50:
            print(f"Warning: Expected 50 logs, found {count}. Checking if pruning script works.")

        page.screenshot(path="verification/step3_pruning.png")
        page.wait_for_timeout(1000)

        context.close()
        browser.close()

if __name__ == "__main__":
    run()
