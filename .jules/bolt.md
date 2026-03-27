## 2026-03-27 - [Incremental Log Rendering Synchronization]
**Learning:** In a high-frequency logging system where both the source (background) and consumer (UI) truncate lists (e.g., `shift()` or `removeChild`), local counters must be capped to the limit to avoid unnecessary full re-renders during state synchronization.
**Action:** Always align consumer-side tracking counters with the maximum buffer size of the producer to prevent "count divergence" that triggers O(n) sync fallbacks.
