import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Create a mock HTML environment
        mock_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mock AI Studio</title>
            <style id="mock-css"></style>
        </head>
        <body>
            <h1>Mock AI Studio</h1>
            <script id="mock-chrome-api">
                window.chrome = {
                    runtime: {
                        onMessage: {
                            addListener: (listener) => {
                                window.extensionMessageListener = listener;
                            }
                        , sendMessage: () => {}
                        },
                        getURL: (path) => path
                    },
                    storage: {
                        local: {
                            get: (keys, cb) => cb({}),
                            set: (obj, cb) => cb && cb()
                        },
                        onChanged: {
                            addListener: (listener) => {
                                window.extensionStorageListener = listener;
                            }
                        }
                    }
                };
            </script>
            <script id="extension-script"></script>
        </body>
        </html>
        """

        page.set_content(mock_html)

        # Inject CSS
        with open('public/extension-chrome/aistudio_ui.css', 'r') as f:
            css_content = f.read()
        page.evaluate(f"document.getElementById('mock-css').textContent = `{css_content}`")

        # Inject JS
        with open('public/extension-chrome/aistudio_ui.js', 'r') as f:
            js_content = f.read()
        # The script is an IIFE, so it will execute immediately
        page.evaluate(js_content)

        # 1. Verify UI initialization
        orchestrator_root = page.query_selector('#omnipotent-orchestrator-root')
        assert orchestrator_root is not None, "Orchestrator UI not found"
        print("✅ UI Initialized")

        # 2. Simulate LOG_EVENT message
        log_message = "Test log message"
        page.evaluate(f"""
            window.extensionMessageListener({{
                action: 'LOG_EVENT',
                log: {{ text: '{log_message}', timestamp: Date.now() }}
            }});
        """)

        # 3. Verify log entry in DOM
        logs_div = page.query_selector('#oo-logs')
        last_log = logs_div.query_selector('.oo-log-entry:last-child')
        assert log_message in last_log.inner_text(), f"Log message '{log_message}' not found in UI"
        print("✅ Log appending verified")

        # 4. Verify 50 log cap
        print("Sending 60 logs to verify cap...")
        for i in range(60):
            page.evaluate(f"""
                window.extensionMessageListener({{
                    action: 'LOG_EVENT',
                    log: {{ text: 'Log {i}', timestamp: Date.now() }}
                }});
            """)

        log_count = page.evaluate("document.getElementById('oo-logs').children.length")
        assert log_count == 50, f"Log count should be 50, but found {log_count}"
        print(f"✅ Log cap (50) verified")

        # 5. Verify XSS protection (using textNode)
        xss_payload = "<img src=x onerror=window.xss_triggered=true>"
        page.evaluate(f"""
            window.extensionMessageListener({{
                action: 'LOG_EVENT',
                log: {{ text: '{xss_payload}', timestamp: Date.now() }}
            }});
        """)

        xss_triggered = page.evaluate("window.xss_triggered")
        assert xss_triggered is None, "XSS Payload was executed!"

        last_log_html = page.evaluate("document.getElementById('oo-logs').lastElementChild.innerHTML")
        assert "&lt;img" in last_log_html or xss_payload not in last_log_html, "XSS Payload was not escaped"
        print("✅ XSS Protection verified")

        # Screenshot for visual confirmation
        os.makedirs('verification', exist_ok=True)
        page.screenshot(path='verification/bolt_ui_optimized.png')
        print("✅ Screenshot saved to verification/bolt_ui_optimized.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
