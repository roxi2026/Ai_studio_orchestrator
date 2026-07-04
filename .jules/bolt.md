## 2025-05-14 - Incremental UI Rendering for Sliding Windows
**Learning:** Full `innerHTML` re-renders of a 50-item log list on every new entry was a significant CPU bottleneck (~3x slowdown). However, implementing incremental `appendChild` updates with a sliding window array (using `shift()`) requires a monotonic counter (e.g., `totalLogs`) to accurately determine which items are "new" between state updates, as array length remains constant once the cap is reached.
**Action:** Always use a monotonic counter in background state to facilitate O(1) incremental UI updates for bounded buffers/queues.

## 2025-05-14 - Network Interception Overhead
**Learning:** Intercepting all fetch/XHR traffic in AI Studio to find a few specific responses causes measurable latency on the host page due to body cloning (`response.clone()`) and stringification.
**Action:** Implement host-based filtering (early exit by URL substring) in `inject.js` before calling `.clone()` or `.text()` to keep the interception overhead negligible.
