## 2025-05-14 - [Optimization] Real-time Telemetry and Debounced Persistence
**Learning:** In Chrome extensions, frequent `chrome.storage.local.set` calls (e.g., for logging) can become a bottleneck and hit write limits. Additionally, re-rendering large log lists using `innerHTML` is O(N) and causes layout thrashing.
**Action:** Use a debounced `saveState` (500ms) to batch storage writes and implement O(1) incremental DOM updates via `appendChild` for real-time telemetry. Use direct message passing (`LOG_EVENT`) for low-latency UI updates bypassing storage sync.
