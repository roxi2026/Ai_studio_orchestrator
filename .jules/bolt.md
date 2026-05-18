## 2025-05-14 - [Efficient Telemetry Stream & Batch Persistence]
**Learning:** O(N) `innerHTML` re-renders for live telemetry logs cause significant UI jank as the session grows, especially when combined with high-frequency `chrome.storage.local.set` calls which trigger expensive serialization.
**Action:** Use O(1) `appendChild` for incremental log updates via message passing, and debounce storage persistence to batch I/O operations.
