import asyncio
from playwright.async_api import async_playwright
import os

async def verify_ui():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        abs_path = os.path.abspath("verification/frontend_verify.html")
        await page.goto(f"file://{abs_path}")

        # Wait for the incremental log to appear
        await page.wait_for_timeout(2000)

        # Take screenshot of the Orchestrator UI
        # In aistudio_ui.js, the root id is 'omnipotent-orchestrator-root'
        root_selector = "#omnipotent-orchestrator-root"
        await page.wait_for_selector(root_selector)

        await page.screenshot(path="/home/jules/verification/verification.png")
        print("Screenshot saved to /home/jules/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_ui())
