## 2025-06-20 - O(1) Incremental Rendering & Storage Debouncing

**Learning:** This codebase suffered from O(N) UI re-renders for every log event, causing significant main-thread lag as the log history reached its cap. Synchronous storage writes on every event further compounded the bottleneck.

**Action:**
1. Use timestamp-based markers in the state to allow the UI to find the last-rendered element and only append new ones via `appendChild`.
2. Implement a 500ms debounce on `chrome.storage` writes in the service worker to batch rapid state updates.
3. Replace `innerHTML` with `document.createTextNode` for both performance and XSS protection.
4. Parallelize extension asset fetching in the landing page using `Promise.all` to reduce download preparation time.
