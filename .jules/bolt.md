# Bolt's Performance Journal ⚡

## 2025-05-15 - Incremental DOM Rendering & Network Filtering
**Learning:** In extension UIs with high-frequency logging, `innerHTML` re-renders become O(N) bottlenecks that spike CPU and cause UI lag. Combining O(1) `appendChild` with source-side timestamping and real-time message broadcasting (bypassing storage latency) provides a near-instant telemetry feel. Additionally, unconditional network interception in `inject.js` adds measurable overhead to the host page; filtering by URL in the main-world reduces this significantly.
**Action:** Always prefer `appendChild` + `createTextNode` for stream-like UIs. Implement message-based real-time updates in parallel with throttled storage writes for high-performance state synchronization. Filter all main-world interceptions as early as possible.
