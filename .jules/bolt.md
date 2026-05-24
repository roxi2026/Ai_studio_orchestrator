## 2024-05-24 - High-Frequency Telemetry Optimization
**Learning:** O(N) full-list re-rendering of logs using `innerHTML` and repeated `toLocaleTimeString` calls creates a significant CPU bottleneck and layout thrashing as the session length increases. Throttling storage I/O while using direct message passing for incremental UI updates allows for O(1) responsiveness without sacrificing data persistence.
**Action:** Use a hybrid approach for telemetry: O(1) incremental appends via direct message broadcasting for live updates, and debounced storage writes for long-term state recovery.
