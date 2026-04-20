## 2025-04-20 - [Efficient Extension Logging]
**Learning:** High-frequency logging in extensions (like real-time orchestration telemetry) can cause severe layout thrashing if using `innerHTML` and redundant disk I/O if calling `chrome.storage.local.set` synchronously.
**Action:** Always implement incremental DOM updates with `appendChild`, cap the number of visible elements, and debounce storage writes in the background service worker. Use real-time message passing (`chrome.runtime.sendMessage`) for UI telemetry instead of relying on storage synchronization latency.
