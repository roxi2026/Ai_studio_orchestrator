## 2025-06-30 - Log Rendering Bottleneck & Evolution

**Learning:** High-frequency logging in the extension UI was causing significant main-thread jank due to O(N) `innerHTML` re-renders of the entire log history (up to 50 entries) on every state change. Even with a small cap, the cost of parsing and re-creating DOM nodes frequently is measurable.

**Action:** Implement O(1) incremental rendering using a monotonic counter (`totalLogs`) in the background state. UI components should track `lastRenderedTotalLogs` and only append new entries using `DocumentFragment` and `appendChild`. This reduced UI update time for logs by ~95% during active orchestration.
