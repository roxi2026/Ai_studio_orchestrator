## 2025-05-14 - Extension UI Performance Bottleneck
**Learning:** Injected extension UIs often use simple state synchronization (e.g., mapping an entire log array to innerHTML), which leads to O(n) rendering complexity. As the log grows, this causes measurable lag in the host application's main thread.
**Action:** Use an 'appendLog' helper with incremental DOM updates (appendChild) and a fixed-size buffer (e.g., 50 entries) to ensure O(1) append performance regardless of session duration.

## 2025-05-14 - Parallelizing Asset Fetching
**Learning:** Sequential await loops for fetching local assets (like extension files for zipping) introduce unnecessary latency equal to the sum of all RTTs.
**Action:** Use Promise.all() to parallelize independent network requests, reducing total latency to approximately the duration of the slowest single request.
