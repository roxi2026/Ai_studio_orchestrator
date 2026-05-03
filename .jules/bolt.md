## 2026-05-03 - Incremental UI and Debounced Storage
**Learning:** High-frequency logging in extensions causes O(N) performance degradation when using `innerHTML`. Frequent `chrome.storage.local.set` calls can throttle the service worker and hit browser quotas.
**Action:** Use incremental DOM updates (`appendChild`) with a fixed buffer size and implement debounced storage writes with a maximum safety delay to balance responsiveness and I/O efficiency.
