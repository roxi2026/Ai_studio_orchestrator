## 2025-05-15 - O(1) Incremental Log Rendering Evolution
**Learning:** Switching from O(N) `innerHTML` re-renders to O(1) `appendChild` for high-frequency logs in browser extensions reduces rendering latency by >99% (from ~37ms to ~0.1ms for 50 entries). Messaging-based (`LOG_EVENT`) updates are significantly more responsive than `chrome.storage` listeners for real-time telemetry.
**Action:** Use direct message passing for high-frequency UI updates and `appendChild`/`textContent` for incremental DOM updates instead of batch re-renders.
