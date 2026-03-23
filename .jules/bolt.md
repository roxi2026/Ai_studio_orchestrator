## 2025-05-14 - Incremental UI Rendering & Storage Debouncing
**Learning:** In Chrome extensions, frequent storage writes (`chrome.storage.local.set`) and full UI re-renders using `innerHTML` are primary sources of UI lag and CPU overhead during long-running background tasks. Direct message passing for incremental updates significantly improves responsiveness.
**Action:** Use a debounced storage write for state persistence and implement incremental DOM updates (e.g., `appendChild`) for high-frequency logs. Always use a sliding window for DOM elements to prevent memory bloat.

## 2025-05-14 - Network Interception Overhead
**Learning:** Monkey-patching `fetch` and `XMLHttpRequest` in the main world script (`inject.js`) without filtering causes significant CPU overhead as the extension tries to clone and read the body of every request on the page, regardless of its relevance.
**Action:** Add early return/filtering logic in interception scripts to skip unrelated URLs. Always cast URL arguments to strings to handle `URL` objects safely.
