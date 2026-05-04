## 2025-05-14 - Optimized Extension UI & Persistence Pipeline
**Learning:** Using `chrome.storage` as the primary mechanism for real-time UI logging creates an O(n) bottleneck where the entire log history is serialized/deserialized and re-rendered on every event. Furthermore, immediate storage writes during high-frequency logging cause excessive disk I/O.
**Action:** Implement a dual-path pipeline: use `chrome.runtime.sendMessage` for O(1) incremental UI updates (appending) and a debounced `chrome.storage` setter (with a max-delay failsafe) for eventual consistency of state persistence.
