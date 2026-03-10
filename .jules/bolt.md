## 2025-05-15 - [High-Performance Orchestration Pipeline]
**Learning:** Network interception of all traffic in a heavy web app like AI Studio causes significant memory and CPU overhead. Selective interception is crucial. Incremental DOM updates and storage debouncing are essential for high-frequency state updates in Chrome extensions.
**Action:** Always filter `fetch` and `XHR` interceptions to the smallest possible set of relevant URLs. Use direct message passing for UI updates to bypass storage I/O latency.
