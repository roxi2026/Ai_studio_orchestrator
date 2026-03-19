## 2025-05-22 - Extension Performance Bottlenecks

**Learning:** Storage writes via `chrome.storage.local.set` in the background service worker are relatively slow and synchronous relative to the UI thread, causing orchestration lag if called for every log. UI re-renders using `innerHTML` are O(n) and cause layout thrashing as the log history grows. Network interception without filtering clones every response (including images/analytics), leading to unnecessary memory pressure.

**Action:**
1. Implement a 500ms debounce for all storage writes.
2. Use direct `chrome.tabs.sendMessage` for real-time log updates and `appendChild` + `TextNode` for O(1) incremental UI updates.
3. Add URL pattern filtering (e.g., `isAIStudioRequest`) to network interceptors to skip processing of irrelevant traffic.
