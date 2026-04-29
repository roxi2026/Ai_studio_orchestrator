## 2026-04-29 - Optimized Telemetry and UI Rendering
**Learning:** O(n) `innerHTML` re-renders and frequent `chrome.storage` writes significantly degrade performance during high-frequency logging events in browser extensions.
**Action:** Use `appendChild` for incremental DOM updates and debounce storage writes to maintain extension responsiveness.
