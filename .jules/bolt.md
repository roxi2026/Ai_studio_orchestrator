## 2025-05-15 - Unfiltered Network Interception Bottleneck
**Learning:** Injecting a script that clones and parses every single network request (Fetch/XHR/WS) in the host page's main world causes significant CPU and memory overhead, especially on complex apps like AI Studio. In this architecture, failing to filter by target URL patterns (e.g., 'generateContent') led to O(N) overhead relative to total page traffic.
**Action:** Always implement early-return filters in interception scripts based on known API endpoint patterns to ensure minimal impact on the host application's performance.

## 2025-05-15 - Synchronous Extension Storage I/O
**Learning:** Frequent small writes to `chrome.storage.local` (e.g., on every log entry) can bottleneck the extension background worker and cause UI lag due to the overhead of cross-process synchronization and disk I/O.
**Action:** Use debouncing for storage writes and implement a direct messaging bridge (e.g., LOG_EVENT) for real-time telemetry to decouple UI responsiveness from persistence latency.
