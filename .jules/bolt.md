# Bolt's Journal - Critical Learnings

## 2026-09-24 - Parallelizing Extension Asset Zip Generation
**Learning:** Sequential `for...of` loops using `await fetch()` for fetching multi-file extension assets introduce a network waterfall latency equal to N * RTT. Using `Promise.all` parallelizes asset retrieval and collapses network latency to max(RTT).
**Action:** Always batch asset fetching for client-side package generation with `Promise.all`.
