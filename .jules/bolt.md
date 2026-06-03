## 2025-05-22 - O(1) Log Rendering & Debounced Storage
**Learning:** O(N) re-renders using `innerHTML` for logs become a major bottleneck as the session grows, especially on mobile browsers like Kiwi. Incremental DOM updates with `appendChild` and `document.createTextNode` deliver O(1) append performance. Additionally, frequent `chrome.storage` writes trigger excessive I/O; debouncing them by 500ms batches updates effectively.
**Action:** Always prioritize incremental DOM updates for list-like UI elements and debounce disk/storage I/O in service workers.

## 2025-05-22 - Network Interception Overhead
**Learning:** Intercepting every `fetch` and `XHR` request and cloning responses in `inject.js` adds measurable latency to the host page's network stack. Filtering by URL in the main-world script prevents unnecessary cloning for unrelated traffic.
**Action:** Implement URL-based filtering in network interceptors to target only essential endpoints.
