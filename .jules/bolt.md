## 2025-05-14 - Optimized Extension Logging & State Persistence

**Learning:** Switching from O(N) `innerHTML` re-renders to O(1) `appendChild` incremental updates significantly reduces UI main-thread blocking, especially as log history grows. Additionally, debouncing `chrome.storage.local.set` prevents I/O bottlenecks during rapid event bursts.

**Action:** Always prefer incremental DOM updates for list-like data and implement debouncing for frequent storage writes in extension service workers. Use real-time message passing (`chrome.runtime.sendMessage`) to maintain UI responsiveness while persistence is throttled.
