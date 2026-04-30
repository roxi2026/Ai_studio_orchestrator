## 2025-05-14 - Network Interception Stability
**Learning:** Modern `fetch` calls often pass `URL` objects instead of strings. Calling `.includes()` directly on these throws a TypeError, crashing the host page's network layer.
**Action:** Always cast URLs to strings (e.g., `String(url)`) before performing heuristic filtering in injected scripts.

## 2025-05-14 - Storage Persistence Starvation
**Learning:** A simple debounce on `chrome.storage.local.set` can lead to "starvation" during high-frequency logging (common in agentic workflows), where the state is never committed to disk.
**Action:** Implement a throttle or `maxWait` (e.g., 15s) alongside the debounce to force periodic commits even during continuous activity.

## 2025-05-14 - O(n) Layout Thrashing in Telemetry
**Learning:** Re-rendering a log list with `innerHTML` and updating `scrollTop` inside a loop causes O(n) layout thrashing.
**Action:** Use `appendChild` for incremental updates and perform a single `scrollTop` update after batch operations. Use a `skipScroll` parameter for sync loops.
