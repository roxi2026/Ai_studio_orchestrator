## 2025-06-27 - Incremental Rendering & Debounced State Persistence
**Learning:** In highly active browser extensions with frequent log updates, re-rendering the entire log list on every state change is O(N) and causes significant layout reflows, especially with `innerHTML`. Switching to O(1) incremental appends using `DocumentFragment` and monotonic counters drastically improves UI responsiveness. Additionally, debouncing `chrome.storage.local.set` calls reduces disk I/O bottlenecks during high-frequency orchestration.
**Action:** Always prefer monotonic counters for sliding-window UI states to enable O(1) updates. Use real-time messaging (e.g., `chrome.tabs.sendMessage`) for UI updates to avoid state polling overhead.

## 2025-06-27 - Selective Network Interception
**Learning:** Intercepting all network traffic in the main world and cloning every response body (O(N) data processing) can degrade host page performance.
**Action:** Implement URL-based filtering early in the interceptor to only process relevant API responses, minimizing memory and CPU overhead.
