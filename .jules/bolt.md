# Bolt's Performance Journal ⚡

## 2025-08-07 - [Telemetry DOM Re-rendering & Request Interception Bottlenecks]
**Learning:** In Chrome extension architectures displaying continuous stream/telemetry logs (sliding window views), completely re-rendering the container's DOM with `innerHTML` results in quadratic O(N^2) complexity with respect to the number of incoming logs. The constant layout reflows and garbage collection churn completely saturate the main thread when AI Studio returns large, rapid JSON chunk updates.
Additionally, main-world interceptors (`inject.js`) capturing *every* outbound fetch/XHR call—and blindly calling `response.clone()` and `clonedResponse.text()`—introduce severe memory bloat and latency spikes on non-orchestrated static resources, analytics, and telemetry APIs.

**Action:**
1. Implement O(1) incremental rendering in UI views using `DocumentFragment` to batch DOM appends, using `document.createTextNode`/`textContent` to avoid parsing overhead and prevent XSS.
2. Utilize a monotonic sequence counter (`state.totalLogs`) in the orchestrator state to accurately calculate slice offsets (`Math.min(state.totalLogs - lastRenderedTotalLogs, state.logs.length)`) for new entries, regardless of sliding-window shifts or resets.
3. Apply aggressive host-based early-exit filtering in interceptors (`inject.js`) *before* cloning response streams or performing postMessage communications. Only proceed if the normalized request URL matches target AI Studio endpoints (`generateContent`, `v1beta`, `executor`, `reviewer`).
