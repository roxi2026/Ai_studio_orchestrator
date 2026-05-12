## 2025-05-14 - [High-Efficiency Messaging & Rendering Pipeline]
**Learning:** O(N) `innerHTML` re-renders for telemetry logs are a major bottleneck as the session grows. Direct broadcasting of `LOG_EVENT` messages bypasses the storage roundtrip (I/O) and allows for O(1) incremental DOM updates using `appendChild`.
**Action:** Always prefer direct message-driven incremental updates for real-time telemetry instead of relying solely on `chrome.storage.onChanged`. Use a sync heuristic in `updateUI` to handle initial load and missed messages.

## 2025-05-14 - [Targeted Network Interception]
**Learning:** Cloned and reading `text()` of every `fetch` request in a high-traffic host app like AI Studio causes significant main-thread overhead and memory pressure.
**Action:** Filter network interceptions to specific relevant endpoints early in the wrapper to minimize impact on the host application performance.
