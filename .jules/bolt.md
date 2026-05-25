## 2025-05-25 - [Telemetry & State Bottleneck]
**Learning:** Found that the extension performs O(N) log rendering on every state change and executes synchronous storage writes for every log entry. This causes UI jank and excessive disk I/O.
**Action:** Transitioning to O(1) incremental DOM updates (appendChild) and implementing a debounced persistence layer (500ms) with real-time message broadcasting for telemetry.
