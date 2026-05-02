import sys
from playwright.sync_api import sync_playwright
import os

def run_test():
    with sync_playwright() as p:
        # Mock HTML content with the extension UI logic
        with open('public/extension-chrome/aistudio_ui.js', 'r') as f:
            js_content = f.read()

        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                #oo-logs { height: 200px; overflow-y: scroll; border: 1px solid #ccc; }
                .oo-log-entry { margin: 4px 0; font-family: monospace; }
                .oo-log-time { color: #666; margin-right: 8px; }
            </style>
        </head>
        <body>
            <div id="omnipotent-orchestrator-root-target"></div>
            <script>
                // Mock Chrome APIs
                window.chrome = {
                    storage: {
                        local: {
                            get: (keys, cb) => cb({}),
                            set: (data, cb) => cb && cb()
                        },
                        onChanged: {
                            addListener: (cb) => { window.storageListener = cb; }
                        }
                    },
                    runtime: {
                        onMessage: {
                            addListener: (cb) => {
                                console.log('Message listener registered');
                                window.messageListener = cb;
                            }
                        },
                        sendMessage: (msg, cb) => { console.log('Message sent:', msg); }
                    }
                };
            </script>
        </body>
        </html>
        """

        abs_path = os.path.abspath('verification/mock_ui.html')
        with open(abs_path, 'w') as f:
            f.write(html_content)

        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{abs_path}")

        # Modify js_content to NOT check for existing root since we want to run it in our mock
        # And expose the listener more explicitly if needed, but it should work if IIFE runs

        page.evaluate(js_content)

        # Wait for initialization
        page.wait_for_timeout(2000)

        # Simulate LOG_EVENT
        page.evaluate("""
            if (window.messageListener) {
                window.messageListener({
                    action: 'LOG_EVENT',
                    entry: { text: 'Test Log 1', timestamp: Date.now() }
                });
            } else {
                // Try to find it if it was not assigned to window (though it should be by our mock)
                console.log('window.messageListener not found, searching...');
            }
        """)

        # Verify log entry exists
        logs = page.query_selector_all(".oo-log-entry")
        print(f"Log entries found: {len(logs)}")
        if len(logs) > 0:
            for log in logs:
                print(f"Log text: {log.inner_text()}")

        # Simulate CLEAR_MEMORY
        page.evaluate("""
            if (window.messageListener) {
                window.messageListener({ action: 'CLEAR_MEMORY' });
            }
        """)

        # Verify logs were cleared and system ready log added
        logs_after_clear = page.query_selector_all(".oo-log-entry")
        print(f"Log entries after clear: {len(logs_after_clear)}")
        if len(logs_after_clear) > 0:
            print(f"Last log text: {logs_after_clear[-1].inner_text()}")

        page.screenshot(path="verification/ui_test.png")
        browser.close()

if __name__ == "__main__":
    run_test()
