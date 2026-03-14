## 2025-05-15 - Optimizing Extension Data Pipeline

**Learning:** Real-time logging via `chrome.storage` is extremely expensive due to disk I/O. Intercepting every network request in a heavy SPA like AI Studio without filtering leads to significant memory overhead.

**Action:**
1. Use direct message passing (`chrome.tabs.sendMessage`) for real-time UI updates, bypassing storage for latency-sensitive events.
2. Debounce storage writes (e.g., 500ms) to batch state updates.
3. Filter network interception early in the wrapper using URL patterns.
4. Favor incremental DOM updates (`appendChild`) over full container re-renders (`innerHTML`).
5. Ensure `fetch` wrappers safely handle `URL` objects by casting to string.
6. Batch `scrollTop` updates outside of loops to minimize layout thrashing.
