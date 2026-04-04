## 2026-04-04 - [UI Rendering & Storage I/O Evolution]
**Learning:** High-frequency logging in browser extensions can lead to (n^2)$ UI re-renders and excessive disk I/O if using 'innerHTML' and immediate 'chrome.storage' writes. Incremental DOM updates and debounced storage are essential for long-running sessions.
**Action:** Always prefer 'appendChild' + 'document.createTextNode' for append-only logs and implement at least a 500ms debounce for any state persistence that happens in a hot path.

## 2026-04-04 - [Network Interception Overhead]
**Learning:** Intercepting 'fetch' by cloning every response and reading the body can significantly increase CPU/memory usage, especially on pages with many small assets or tracking requests.
**Action:** Implement granular URL filtering in 'inject.js' before cloning the response to ensure only relevant payloads are processed.
