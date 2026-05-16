# Bolt's Journal - Critical Performance Learnings

## 2025-05-14 - [Incremental Log Sync & Storage Debounce]
**Learning:** In Chrome extensions, frequent `chrome.storage.local.set` calls can lead to significant disk I/O bottlenecks and "write-storms", especially during high-frequency logging. Simultaneously, re-rendering large log lists using `innerHTML` is an O(N) operation that blocks the UI thread.
**Action:** Always implement a debounce (e.g., 500ms) for storage writes. Use an incremental sync model where logs are pushed via `chrome.runtime.sendMessage` and appended using `appendChild` (O(1)) instead of full list re-renders. Use source-side timestamps to ensure consistency across different UI contexts (popup vs. content script).
