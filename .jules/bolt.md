## 2025-06-25 - Extension Log Rendering Bottleneck
**Learning:** Traditional `innerHTML` re-renders for streaming logs (common in LLM extensions) scale poorly (O(N^2) total work over time). In this codebase, rendering 1000 entries took ~16.6s vs ~48ms for incremental `appendChild` (a ~350x speedup).
**Action:** Always implement incremental rendering with `DocumentFragment` or `appendChild` for high-frequency streaming UI components.

## 2025-06-25 - Chrome Storage I/O Optimization
**Learning:** Frequent `chrome.storage.local.set` calls can block the service worker or UI thread if not throttled, especially during high-frequency log events.
**Action:** Use debounced storage persistence (e.g., 500ms) combined with direct messaging for real-time UI updates to maintain perceived speed while reducing disk I/O.
