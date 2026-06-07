## 2025-05-15 - [O(1) Log Rendering & Storage Debouncing]
**Learning:** Switching from O(N) `innerHTML` re-renders to O(1) `appendChild` incremental updates reduced log rendering time for 50 entries by over 95%. Storage debouncing in the service worker effectively batches high-frequency log events, minimizing disk I/O at the cost of slight UI update latency (500ms).
**Action:** Always prefer incremental DOM updates for list-based UIs (logs, feeds) and debounce persistence logic when handling rapid state changes. Ensure UI synchronization logic handles batched updates from storage listeners.
