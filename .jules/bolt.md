## 2025-06-01 - O(N) Log Rendering Bottleneck
**Learning:** In browser extensions with real-time logging (like orchestrators), using `innerHTML` to re-render the entire log list on every message leads to $O(N^2)$ total work and noticeable UI jank as the session grows. Incremental $O(1)$ appends are essential.
**Action:** Always implement incremental DOM updates with `appendChild` and `createTextNode` for log streams. Use a message-based broadcast from the background script instead of relying solely on `chrome.storage` listeners for UI updates.

## 2025-06-01 - Excessive Disk I/O from State Persistence
**Learning:** Frequent small updates to `chrome.storage.local` (e.g. on every log entry) can saturate disk I/O and increase latency.
**Action:** Implement a 500ms debounce for storage writes to batch updates.

## 2025-06-01 - Network Interception Overhead
**Learning:** Cloning every fetch response in the host page to inspect it adds significant overhead to unrelated page activities.
**Action:** Filter network interceptions by URL (e.g., `v1beta`, `generateContent`) before cloning or processing the response body.
