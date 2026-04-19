## 2025-05-14 - [High-Frequency Telemetry Anti-patterns]
**Learning:** In orchestration extensions, the telemetry feed is the most active component. Using `innerHTML` for log updates creates an O(N) bottleneck that grows as the session progresses. Furthermore, synchronous `chrome.storage.local.set` calls during high-frequency logging (e.g., model streaming or rapid puppet actions) can cause significant I/O blocking and UI lag.

**Action:** Always implement incremental DOM updates (e.g., `appendChild` + `createTextNode`) with a hard cap on DOM element count (e.g., 50 entries). Use debounced storage writes (e.g., 500ms) and direct message broadcasting for real-time UI updates to bypass storage latency.
