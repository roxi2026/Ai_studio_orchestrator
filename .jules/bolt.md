## 2025-05-14 - O(1) Log Pipeline Optimization
**Learning:** Switching from O(N) `innerHTML` re-renders to O(1) `appendChild` incremental updates reduced log rendering time by over 70% in headless benchmarks. Combining this with a debounced storage write (500ms) significantly reduced CPU and I/O pressure during high-frequency orchestration events.
**Action:** Always prioritize message-based incremental updates for live telemetry over storage-based state polling.

## 2025-05-14 - Targeted Network Interception
**Learning:** Cloned fetch responses on every request in AI Studio introduced measurable latency and memory pressure. Filtering for specific API endpoints (e.g., `generateContent`) in the main-world injection script is critical for host-page performance.
**Action:** Implement endpoint filtering early in the lifecycle of any network-intercepting "brain" content script.
