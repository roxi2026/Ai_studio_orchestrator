## 2025-05-15 - Integrated Performance Evolution

**Learning:** Significant performance gains in Chrome extensions can be achieved by optimizing the communication and rendering path between the background service worker and content scripts. Specifically:
1. **Incremental UI Rendering:** Switching from $O(N)$ full `innerHTML` re-renders to $O(1)$ `appendChild` (via `DocumentFragment`) for logs prevents UI lag as history grows. Using a monotonic `totalLogs` counter is essential for synchronizing state between the persistent background and ephemeral UI.
2. **Filtered Network Interception:** Injected scripts that intercept all traffic (XHR/Fetch) create significant overhead on high-traffic pages like AI Studio. URL-based filtering before cloning responses reduces main-thread blocking and memory consumption.
3. **Debounced Persistence:** Frequent `chrome.storage.local.set` calls during rapid logging can saturate disk I/O; debouncing these writes significantly improves overall background worker responsiveness.

**Action:** Always implement incremental rendering for log-like UIs and use monotonic counters for synchronization. Prioritize filtering at the source for network interception.
