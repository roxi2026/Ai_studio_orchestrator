# Bolt's Journal

## 2025-08-23 - Parallel Extension File Fetching
**Learning:** Fetching extension bundle assets sequentially with `await` inside a `for...of` loop causes network head-of-line blocking (12 sequential roundtrips).
**Action:** Use `Promise.all` with `map` to parallelize asset fetching, reducing total latency from O(N * latency) to O(latency).
