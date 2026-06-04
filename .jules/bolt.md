## 2025-05-14 - [Exposing IIFE listeners for Headless Verification]
**Learning:** Browser extension scripts often use IIFEs to avoid global scope pollution. This makes it impossible for external verification scripts (like Playwright) to trigger internal event listeners directly.
**Action:** When writing verification mocks for IIFE-wrapped scripts, explicitly expose internal listeners to the global `window` object (e.g., `window.extensionMessageListener = listener`) to enable targeted event injection and benchmarking without modifying the production script's closure logic.

## 2025-05-14 - [O(1) Log Rendering with DOM Increments]
**Learning:** Re-rendering a long list of logs using `innerHTML` and `map()` is O(N) and causes significant layout thrashing as the list grows.
**Action:** Use `appendChild` for incremental updates and a `while` loop with `removeChild` to enforce a fixed DOM size. This delivers O(1) performance and keeps the memory footprint constant.
