from playwright.sync_api import sync_playwright, expect
import os

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We'll create a mock page to test the extension UI in isolation
        # because we can't easily test a real Chrome extension in this environment
        # without complex setup.

        # Load the real CSS
        with open('public/extension-chrome/aistudio_ui.css', 'r') as f:
            css = f.read()

        # Load the real JS logic but we need to mock chrome.* APIs
        with open('public/extension-chrome/aistudio_ui.js', 'r') as f:
            js = f.read()

        # Create a mock HTML
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>{css}</style>
        </head>
        <body>
            <div id="mock-host"></div>
            <script>
                // Mock chrome APIs
                window.chrome = {{
                    storage: {{
                        local: {{
                            get: (keys, cb) => cb({{}}),
                            set: (obj, cb) => cb && cb()
                        }},
                        onChanged: {{
                            addListener: () => {{}}
                        }}
                    }},
                    runtime: {{
                        onMessage: {{
                            addListener: (listener) => {{ window.mockMsgListener = listener; }}
                        }},
                        sendMessage: (msg) => console.log('Message sent:', msg),
                        getURL: (path) => path
                    }}
                }};

                // Execute the UI script
                {js}
            </script>
        </body>
        </html>
        """

        page.set_content(html)

        # Verify initial state
        expect(page.locator('#omnipotent-orchestrator-root')).to_be_visible()

        # Simulate some logs
        page.evaluate("""() => {
            const logs = [
                { id: '1', text: 'Initializing...', timestamp: '12:00:00' },
                { id: '2', text: 'Deploying puppet...', timestamp: '12:00:05' }
            ];
            // Simulate receiving logs via LOG_EVENT
            logs.forEach(l => window.mockMsgListener({ action: 'LOG_EVENT', log: l }));
        }""")

        # Take a screenshot
        page.screenshot(path="verification/bolt_ui_optimized.png")
        print("Screenshot saved to verification/bolt_ui_optimized.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
