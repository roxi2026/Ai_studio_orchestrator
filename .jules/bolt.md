## 2025-05-14 - [DOM Rendering] O(N) log rendering bottleneck
**Learning:** Even with a small capped buffer (50 entries), re-rendering the entire log list via `innerHTML` on every update creates significant layout reflows and CPU spikes during high-frequency orchestration events.
**Action:** Always implement O(1) incremental rendering for log/telemetry views using a monotonic state counter and `appendChild`/`DocumentFragment` instead of `innerHTML` re-writes.
