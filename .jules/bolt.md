## 2025-05-22 - [Optimized State & UI Synchronization]
**Learning:** In Chrome extensions, frequent 'chrome.storage.local.set' operations and full DOM 'innerHTML' re-renders in content scripts create significant UI lag (layout thrashing) during high-throughput orchestration. Direct message passing for incremental updates ('LOG_EVENT') combined with debounced storage writes provides the best balance of real-time feedback and data persistence.

**Action:** Use 'chrome.tabs.sendMessage' for real-time, incremental UI updates in content scripts. Implement O(1) DOM operations (appendChild) and prune DOM nodes to keep a fixed memory footprint. Debounce all 'chrome.storage' writes by at least 500ms in the background script.
