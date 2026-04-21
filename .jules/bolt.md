## 2026-04-21 - Optimized Telemetry & State Management
**Learning:** Injected scripts in Chrome extensions can significantly impact page performance if they clone and process every network request. Frequent storage writes and O(n) UI re-renders also create measurable lag.
**Action:** Use early-exit filters in network interceptors, implement debounced storage writes, and shift to O(1) incremental DOM updates for real-time telemetry.
