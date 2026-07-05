# Bolt's Performance Journal ⚡

## 2025-05-15 - [Extension UI] O(1) Incremental Rendering vs O(N) full re-renders
**Learning:** Re-rendering an entire log list using `innerHTML` and `Array.map` on every update is a significant CPU bottleneck as the history grows. It also introduces flickering and resets scroll positions if not handled carefully.
**Action:** Use a monotonic counter (`totalLogs`) in the source of truth (background script) and implement incremental rendering in the UI using `DocumentFragment` and `appendChild`. This ensures O(1) performance per update and provides a natural path for XSS protection via `textContent`.

## 2025-05-15 - [Extension Messaging] Debounced Storage Persistence
**Learning:** In long-running orchestration tasks, log events occur frequently. Synchronous or immediate calls to `chrome.storage.local.set` on every event create excessive IPC overhead and disk I/O.
**Action:** Implement a debounced `saveState` (e.g., 500ms) to batch multiple state changes into a single storage write.

## 2025-05-15 - [Network Interception] Host-Page Overhead Filtering
**Learning:** Intercepting every `fetch` and `XHR` request in the main world of a complex application like AI Studio can impact host-page performance if the interception logic processes every response.
**Action:** Apply URL-based filtering as early as possible in the `inject.js` script to skip processing for irrelevant domains or API endpoints, minimizing the main thread impact on the target page.
