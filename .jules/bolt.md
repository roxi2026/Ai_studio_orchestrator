## 2025-06-15 - Incremental Log Rendering Optimization
**Learning:** In browser extensions, re-rendering the entire log history with `innerHTML` becomes a major performance bottleneck as log counts grow. DOM operations are expensive, and replacing $N$ nodes when only 1 is new is $O(N)$.
**Action:** Always implement incremental rendering (`appendChild`) for list-based UI components. Use a backward-search strategy to sync missing logs after UI re-initialization or state updates.

## 2025-06-15 - Storage Write Debouncing
**Learning:** Rapid state updates (like frequent logging) can cause excessive `chrome.storage.local.set` calls, leading to disk I/O overhead and potential throttling.
**Action:** Implement debouncing for storage writes to batch updates. Ensure a migration path exists when changing state schemas (e.g., string to object) to prevent data corruption.
