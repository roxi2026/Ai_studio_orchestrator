## 2025-02-14 - Telemetry & State Sync Bottleneck

**Learning:** High-frequency logging in Chrome extensions can lead to major performance degradation due to two primary factors: asynchronous write thrashing to `chrome.storage.local` and O(N) UI re-renders using `innerHTML`. Disk I/O is expensive, and redundant DOM manipulation blocks the main thread.

**Action:**
1. Implement a 500ms debounce for all `chrome.storage.local.set` calls to batch state updates.
2. Use `chrome.tabs.sendMessage` for real-time, low-latency UI updates instead of relying solely on storage events.
3. Transition UI logic to incremental DOM updates (`appendChild`) with a fixed-size buffer (e.g., 50 items) to keep the DOM lean and rendering fast.
4. Always sanitize log content using `document.createTextNode` to prevent XSS when rendering intercepted data.
