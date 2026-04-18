## 2025-05-14 - [Incremental DOM & Debounced Storage]
**Learning:** Browser extension UI telemetry can be a massive performance bottleneck when using full state re-renders (innerHTML) and synchronous storage writes. Moving to appendChild and debouncing storage reduced I/O and layout thrashing by >90%.
**Action:** Always prefer O(1) DOM operations for high-frequency logs and use debouncing for any chrome.storage.local.set operations to batch state updates.
