## 2025-05-14 - O(N) UI Re-renders and Storage I/O Bottlenecks
**Learning:** The extension was performing a full `innerHTML` re-render of the log list for every new log entry. While acceptable for a few entries, this became a bottleneck as the log reached its 50-entry cap, especially during high-frequency orchestration events. Additionally, every log entry triggered an immediate `chrome.storage.local.set`, leading to excessive disk I/O.

**Action:** Switched to O(1) incremental DOM updates using `appendChild` and `document.createTextNode`. Implemented a 500ms debounce for storage writes to batch state updates. Always prefer incremental updates for high-frequency event streams.
