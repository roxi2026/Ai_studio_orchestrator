## 2025-05-15 - Incremental DOM Rendering & Storage Debouncing

**Learning:** Re-rendering an entire log list (O(n)) using `innerHTML` during high-frequency telemetry updates causes measurable layout thrashing and CPU spikes. Additionally, frequent `chrome.storage.local.set` calls (blocking I/O) can degrade extension performance and responsiveness.

**Action:** Use `appendChild` with `document.createTextNode` for O(1) telemetry updates. Implement a hard cap on DOM elements (e.g., 50 items) to keep memory usage constant. Use a debounced storage saver (e.g., 500ms) to batch multiple state updates into a single disk write.
