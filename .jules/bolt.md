## 2025-05-22 - [Extension Infrastructure & Telemetry Optimization]
**Learning:** High-frequency logging in Chrome extensions can lead to significant UI jank and I/O overhead if using `innerHTML` re-renders and synchronous `chrome.storage` writes. Sequential network requests for small assets significantly delay ZIP bundle generation in the landing page.
**Action:** Implement O(1) DOM appends via `appendChild`/`createTextNode`, use direct message passing (`LOG_EVENT`) for real-time telemetry, debounce storage writes (500ms), and parallelize network requests with `Promise.all`.
