## 2025-03-21 - [Optimizing the Extension Communication and Rendering Pipeline]

**Learning:** Re-rendering a long list of logs using `innerHTML` is an O(n) operation that causes layout thrashing and increases CPU usage as the session grows. Furthermore, frequent `chrome.storage` writes introduce significant I/O overhead.

**Action:**
1. Use `appendChild` + `document.createTextNode` for incremental, low-overhead UI updates.
2. Implement DOM pruning (e.g., limit to 50 items) to prevent memory bloat.
3. Debounce storage writes (e.g., 500ms) and use direct `chrome.tabs.sendMessage` for real-time logs to bypass the storage-to-UI delay without sacrificing responsiveness.
4. Add URL filtering to network interceptors to avoid cloning and processing irrelevant fetch/XHR requests.
