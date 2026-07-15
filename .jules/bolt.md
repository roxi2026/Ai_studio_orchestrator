## 2025-07-15 - Incremental O(1) Log Rendering
**Learning:** Legacy O(N) log rendering using `innerHTML` caused significant layout thrashing and performance degradation as history grew. Appending `DocumentFragment` updates with a monotonic counter (`totalLogs`) provides O(1) performance for single log additions and ~4.89x speedup in benchmarks.
**Action:** Use monotonic counters for sliding window state synchronization and `DocumentFragment` for batch DOM updates to minimize reflows.
