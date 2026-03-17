## 2025-05-15 - Reactive UI & Debounced State Sync
**Learning:** Pull-based storage synchronization for high-frequency events like logging leads to O(n) re-renders and excessive disk I/O. Switching to a push-based model using direct message passing (`LOG_EVENT`) and incremental DOM updates (`appendChild`) eliminates UI stuttering. Debouncing storage writes (`saveState`) by 500ms reduces overhead during burst activity.
**Action:** Use direct message passing for real-time telemetry and always implement incremental DOM updates for append-only UI components like logs or feeds.
