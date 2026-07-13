import os
from playwright.sync_api import sync_playwright, expect

def verify_landing_page(page):
    # Go to the landing page
    page.goto("http://localhost:3000")

    # Wait for the download button
    download_btn = page.get_by_role("button", name="Download for Chrome")
    expect(download_btn).to_be_visible()

    # Take screenshot of landing page
    page.screenshot(path="verification/landing_page.png")
    print("Landing page screenshot taken.")

def verify_extension_ui_logic(page):
    # Since we can't easily run the actual extension in this headless environment,
    # we'll create a mock page that uses the extension's UI logic.

    # Read the CSS and JS
    with open("public/extension-chrome/aistudio_ui.css", "r") as f:
        css = f.read()
    with open("public/extension-chrome/aistudio_ui.js", "r") as f:
        js = f.read()

    # Create a mock HTML page
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>{css}</style>
    </head>
    <body>
        <div id="mock-host"></div>
        <script>
            // Mock chrome API
            window.chrome = {{
                storage: {{
                    local: {{
                        get: (keys, cb) => cb({{}}),
                        set: (data, cb) => cb && cb()
                    }},
                    onChanged: {{
                        addListener: () => {{}}
                    }}
                }},
                runtime: {{
                    onMessage: {{
                        addListener: () => {{}}
                    }},
                    sendMessage: () => {{}},
                    getURL: (path) => path
                }}
            }};

            // Inject the UI script
            {js}
        </script>
    </body>
    </html>
    """

    page.set_content(html_content)

    # Wait for the UI to be injected
    expect(page.locator("#omnipotent-orchestrator-root")).to_be_visible()

    # Manually trigger an updateUI via the exposed function if possible,
    # or just take a screenshot of the initial state.
    # Note: aistudio_ui.js is an IIFE, so updateUI isn't global.

    # Take screenshot of the extension UI
    page.screenshot(path="verification/extension_ui.png")
    print("Extension UI screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Note: We assume the dev server is NOT running for this script,
        # so we'll just do the mock UI verification.
        try:
            verify_extension_ui_logic(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
