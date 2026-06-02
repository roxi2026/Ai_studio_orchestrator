## 2025-05-14 - [O(1) Log Rendering & Debounced I/O]
**Learning:** High-frequency state updates in browser extensions (like logs) cause severe performance degradation when synchronized via `chrome.storage.onChanged` due to full UI re-renders ($O(N)$) and excessive Disk I/O.
**Action:** Use direct `chrome.runtime.sendMessage` for real-time incremental DOM updates ($O(1)$ `appendChild`) and debounce storage writes (e.g., 500ms) to batch persistence. Always filter main-world network interceptions by URL to minimize host page overhead.
