## 2026-08-16 - Network Interception & Incremental Log Rendering Optimization

**Learning:** Unfiltered fetch/XHR network interception in injected main-world scripts (`inject.js`) introduces significant CPU and memory overhead by cloning responses and stringifying bodies for all site traffic (analytics, static assets, telemetry). Furthermore, re-rendering fixed-capacity UI log windows with `innerHTML` causes unnecessary layout reflows on every state update tick.

**Action:** Always filter request targets early by URL endpoints before cloning response streams or emitting `window.postMessage` events. Use a monotonic counter (`state.totalLogs`) with `DocumentFragment` and `replaceChildren` to achieve O(1) incremental DOM updates for sliding-window log buffers.
