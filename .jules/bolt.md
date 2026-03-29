## 2025-05-15 - Incremental Telemetry & Selective Interception
**Learning:** In high-frequency telemetry systems like this browser extension, re-rendering the entire log list on every entry using `innerHTML` creates significant CPU/GPU churn. Additionally, cloning every network request in `inject.js` without filtering leads to memory bloat and performance degradation across the entire browser session.

**Action:**
1. Use direct message passing (`LOG_EVENT`) for real-time incremental DOM updates (appending individual nodes) rather than relying on full storage-state syncs for every log.
2. Implement a 500ms debounce on storage writes (`chrome.storage.local.set`) to batch I/O operations.
3. Add strict URL pattern filtering in network interceptors to only process relevant AI Studio API traffic.
4. Implement a "divergence-check" synchronization fallback in the UI to ensure consistency with the background source of truth while maintaining the speed of incremental updates.
