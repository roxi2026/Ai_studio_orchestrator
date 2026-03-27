import time
import os
from playwright.sync_api import sync_playwright

def test_ui_performance():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Load the mock page
        # Note: In a real environment, we'd use a server, but for simplicity here we assume files are relative
        file_path = os.path.abspath("public/mock/ui_test.html")
        page.goto(f"file://{file_path}")

        # Wait for UI to initialize
        page.wait_for_selector("#omnipotent-orchestrator-root")
        print("UI Initialized")

        # Initial logs check
        count_text = page.locator("#log-count").inner_text()
        print(f"Initial: {count_text}")

        # 1. Test Rapid Log Injection
        print("Testing rapid log injection (100 logs)...")
        start_time = time.time()
        page.click("#trigger-logs")

        # Wait for the last log to appear or for the count to reach the limit
        page.wait_for_function("document.querySelectorAll('.oo-log-entry').length >= 50")
        end_time = time.time()

        # Verify count (should be 50 due to the limit)
        final_count_text = page.locator("#log-count").inner_text()
        print(f"Final Count after 100 injections: {final_count_text}")
        print(f"Time taken: {end_time - start_time:.4f}s")

        # Check if the number of logs is exactly 50 (it should be, because we limited it)
        logs_count = page.locator(".oo-log-entry").count()
        assert logs_count == 50, f"Expected 50 logs, got {logs_count}"
        print("SUCCESS: Log limit (50) correctly enforced.")

        # 2. Test Clear Functionality
        print("Testing clear functionality...")
        page.click("#clear-logs")

        # Wait for the logs to clear (one log might remain if the background mock sends a confirmation)
        # In our mock, addLogEntry('System: Memory cleared.') is called after the reset.
        page.wait_for_function("document.querySelectorAll('.oo-log-entry').length <= 1")

        clear_count = page.locator(".oo-log-entry").count()
        print(f"Count after clear: {clear_count}")
        assert clear_count <= 1, "Logs were not cleared"
        print("SUCCESS: Logs cleared successfully.")

        # Take a screenshot for visual confirmation
        page.screenshot(path="verification/ui_perf_result.png")
        print("Screenshot saved to verification/ui_perf_result.png")

        browser.close()

if __name__ == "__main__":
    test_ui_performance()
