# Bolt's Journal - Omnipotent AI Orchestrator

## 2026-05-14 - High-Frequency State Persistence Bottleneck
**Learning:** The extension calls `chrome.storage.local.set` (disk I/O) on every log entry and state change. In a fast-moving orchestration loop, this creates significant I/O overhead and can hit rate limits if too many updates happen in a short window.
**Action:** Implement a debounced `saveState` to batch multiple updates.

## 2026-05-14 - O(N) UI Re-renders for Logs
**Learning:** `aistudio_ui.js` re-renders the entire log history (up to 50 entries) using `innerHTML` for every new log. This causes O(N) DOM operations and layout thrashing.
**Action:** Switch to O(1) incremental DOM updates (appendChild) for logs.
