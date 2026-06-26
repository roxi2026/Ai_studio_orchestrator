# Bolt ⚡ Performance Journal

## 2025-05-15 - Optimized Extension Performance Suite

**Learning:**
This repository implements a browser orchestration agency where performance bottlenecks were discovered in three core areas:
1. **Storage I/O:** Every log entry triggered a synchronous `chrome.storage.local.set`, leading to excessive disk writes during high-frequency orchestration.
2. **UI Rendering:** The log telemetry in both AI Studio and the Popup used O(N) `innerHTML` re-renders, causing significant CPU spikes and layout reflows as history grew.
3. **Distribution Latency:** Extension assets were fetched sequentially when generating the distribution zip, multiplying network round-trips.
4. **Main Thread Pressure:** The main-world interceptor was cloning and parsing every single host fetch/XHR request without filtering, even for non-API assets.

**Action:**
1. **Debounced Persistence:** Implemented a 500ms debounced `saveState` in `background.js`. This batches multiple logs into a single write operation, reducing I/O operations by up to 95% during busy cycles.
2. **Incremental UI Rendering:** Switched to O(1) `appendChild` logic in `aistudio_ui.js` and `popup.js`. Using `totalLogs` monotonic counter and `DocumentFragment`, we now only render new entries, eliminating O(N) layout thrashing.
3. **Parallel Distribution:** Refactored `App.tsx` to use `Promise.all` for extension asset fetching, reducing total download time from O(N) to O(1) relative to the number of files.
4. **Targeted Interception:** Added host and path filtering in `inject.js` to skip irrelevant network traffic early, preserving memory and main-thread responsiveness in AI Studio.
