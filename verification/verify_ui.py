from playwright.sync_api import sync_playwright, expect
import os
import time

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need a server to serve the local files correctly due to CORS/Relative paths
        # But for simple HTML we might be able to use file://
        page = browser.new_page()

        abs_path = os.path.abspath("verification/mock_ui.html")
        page.goto(f"file://{abs_path}")

        # Wait for the UI to be injected
        page.wait_for_selector("#omnipotent-orchestrator-root")

        # Maximize if needed (it auto-maximizes after 500ms)
        time.sleep(1)

        # Check initial state
        logs = page.locator("#oo-logs")
        expect(logs).to_contain_text("Initial log from storage")

        # Simulate a LOG_EVENT message
        page.evaluate("""
            window.runtimeMessageListener({
                action: 'LOG_EVENT',
                log: 'Real-time incremental log test',
                time: '12:34:56'
            });
        """)

        expect(logs).to_contain_text("Real-time incremental log test")
        expect(logs).to_contain_text("12:34:56")

        # Take screenshot
        page.screenshot(path="verification/bolt_ui_optimized.png")
        print("Screenshot saved to verification/bolt_ui_optimized.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
