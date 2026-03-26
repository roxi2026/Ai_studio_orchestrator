## 2024-05-23 - [Optimization: Log Rendering, Storage Debouncing & Interception Filtering]

**Learning:** Re-rendering a long list of logs using `innerHTML` on every update is O(N) and causes layout thrashing, which becomes noticeable as the log history grows. Additionally, calling `chrome.storage.local.set` on every log entry creates unnecessary I/O overhead and can hit rate limits. Cloning *every* network response in `inject.js` consumes excessive CPU/memory for data we don't need.

**Action:**
- Use `appendChild` and `document.createTextNode` for O(1) log updates.
- Track a local `currentLogCount` to perform incremental DOM updates.
- Limit the DOM to 50 log entries to prevent memory leaks.
- Implement a 500ms debounce for storage writes.
- Use direct `LOG_EVENT` message passing for real-time updates when the UI is active.
- Add URL filtering to `inject.js` to only process relevant AI Studio requests.
- Always cast URL arguments to string in `inject.js` to avoid comparison failures with `URL` objects.
- Mock the Chrome API for headless verification of extension UI components.
