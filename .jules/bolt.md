## 2025-05-14 - [Incremental UI Rendering & Debounced Persistence]
**Learning:** O(N) full-container re-rendering for logs created a significant bottleneck as orchestration history grew, leading to main-thread jank. Additionally, frequent `chrome.storage.local.set` calls during high-frequency logging caused noticeable disk I/O overhead.
**Action:** Implement O(1) incremental rendering using `DocumentFragment` and a monotonic `totalLogs` counter to track sync state. Use a 500ms debounce for state persistence with an `immediate` override for critical user actions.

## 2025-05-14 - [Network Interceptor Filtering]
**Learning:** Intercepting and cloning every network request in the host page (including telemetry and static assets) introduced unnecessary overhead and message-passing bloat.
**Action:** Implement URL-based filtering in `inject.js` to only process AI Studio's content generation and orchestration APIs.
