## 2025-05-14 - Optimized Telemetry and Interception Overhead

**Learning:** Chrome extension `storage.local.set` is a blocking I/O operation that is rate-limited. High-frequency logging (e.g., from an orchestrator) can cause significant UI lag if every log triggers a storage write and a full DOM re-render of the log list via `innerHTML`. Additionally, network interceptors in `inject.js` that clone every request/response consume unnecessary CPU and memory if they don't filter for target URLs early.

**Action:**
1. Implement a 500ms debounce for storage writes in the background script.
2. Use direct `chrome.runtime.sendMessage` for real-time UI updates (LOG_EVENT) instead of relying on storage listeners for every change.
3. Replace `innerHTML` with `appendChild` + `document.createTextNode` and a fixed DOM node limit (e.g., 50 entries) to ensure O(1) rendering performance.
4. Add early URL string filtering in `inject.js` to avoid cloning non-relevant network traffic.
>>>>>>> REPLACE
