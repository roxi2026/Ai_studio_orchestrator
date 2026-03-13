## 2025-05-15 - Incremental UI Updates & IPC Optimization
**Learning:** High-frequency logging in Chrome extensions can lead to massive DOM churn if full-list re-renders are used. Additionally, relying solely on `chrome.storage.onChanged` for UI updates introduces unnecessary I/O latency. Direct message passing for telemetry combined with incremental DOM appending (appendChild) provides a much smoother user experience and significantly reduces CPU overhead.
**Action:** Use direct `chrome.tabs.sendMessage` for real-time telemetry and implement `DocumentFragment` or incremental `appendChild` for long lists.

## 2025-05-15 - Network Interception Filtering
**Learning:** Intercepting every `fetch` and `XMLHttpRequest` in a complex app like AI Studio is expensive. Cloning responses and converting them to text for every script, image, and analytics ping wastes memory and CPU.
**Action:** Always implement early-return URL filters in main-world injection scripts to only process traffic relevant to the extension's core logic.

## 2025-05-15 - UI Sync Logic with Limit
**Learning:** When a log list has a fixed size (e.g., 50), the list length remains constant once the limit is reached even as the content shifts. Checking `count !== length` is insufficient for sync.
**Action:** Compare the content of the latest log entry (or a timestamp) to ensure the UI is truly in sync with the state when the list length is at its maximum.
