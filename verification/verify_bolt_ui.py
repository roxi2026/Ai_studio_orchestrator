from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the mock UI test page
    page.goto("http://localhost:3000/public/mock/ui_test.html")
    page.wait_for_timeout(1000)

    # 1. Show initial state
    page.screenshot(path="verification/screenshots/1_initial.png")
    page.wait_for_timeout(500)

    # 2. Trigger 100 logs
    print("Triggering 100 logs...")
    page.click("#trigger-logs")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/2_after_logs.png")

    # 3. Verify the log limit (50) visually in the UI
    # The mock has a #log-count div
    page.wait_for_selector("#log-count:has-text('UI Logs: 50')")
    print("Log limit verified in UI.")

    # 4. Clear logs
    print("Clearing logs...")
    page.click("#clear-logs")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/3_after_clear.png")

    # 5. Final state
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
