## 2025-05-22 - [Optimized Extension Data Pipeline]
**Learning:** Redundant DOM overwrites using `innerHTML` and frequent `chrome.storage` writes create significant layout thrashing and I/O overhead during high-frequency telemetry logging. Selective network interception reduces CPU load by avoiding cloning of irrelevant requests.
**Action:** Always use incremental DOM updates (`appendChild`), debounced storage writes, and direct message passing for real-time telemetry. Implement URL filtering in network hooks to prioritize critical paths.
