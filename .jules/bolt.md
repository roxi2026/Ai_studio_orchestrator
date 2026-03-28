## 2026-03-28 - Extension Performance Overhaul
**Learning:** Intercepting all network traffic via 'cloning' in the main world and re-rendering log lists via 'innerHTML' in the UI creates significant CPU/memory overhead during long orchestration tasks. Storage persistence via 'chrome.storage' is also a common disk I/O bottleneck when not debounced.

**Action:** Always filter network interception to specific URL patterns, use incremental 'appendChild' for UI updates with a capped DOM size, and implement debouncing for storage writes to minimize overhead.
