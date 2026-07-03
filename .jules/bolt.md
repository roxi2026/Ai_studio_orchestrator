## 2026-07-03 - [Orchestrator Performance Pack]
**Learning:** In highly active extensions with frequent logging or network interception, O(N) DOM re-renders and synchronous storage I/O become the primary bottlenecks. $O(1)$ incremental rendering with `DocumentFragment` and debounced storage writes provide the highest ROI for perceived performance.
**Action:** Always implement monotonic counters (e.g., `totalLogs`) for sliding-window state arrays to facilitate efficient incremental UI updates across disconnected components (Background vs Content vs Popup).
