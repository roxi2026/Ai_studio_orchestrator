## 2026-04-14 - [High-Frequency Log Optimization]
**Learning:** In browser extensions, high-frequency logging to 'chrome.storage' can bottleneck the background service worker and cause UI lag. Combining a debounced storage write (500ms) with direct 'chrome.tabs.sendMessage' for real-time incremental updates (LOG_EVENT) provides both persistence and low-latency feedback without I/O overhead.
**Action:** Use the "Broadcaster Pattern" (direct messaging for UI updates + debounced storage for persistence) in all extension projects with active telemetry.

## 2026-04-14 - [Selective Network Interception]
**Learning:** Monkey-patching global 'fetch' or 'XHR' without filtering causes the extension to clone and parse every single request/response (telemetry, assets, etc.), leading to measurable CPU/memory overhead in the host page.
**Action:** Always implement a 'isTargetUrl' filter at the earliest possible stage in 'inject.js' to minimize impact on host page performance.
