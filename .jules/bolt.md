## 2025-05-15 - [High-Efficiency Orchestration Backbone]
**Learning:** In Chrome extensions, using `chrome.storage.onChanged` to sync large lists (like logs) to the UI causes O(n²) re-rendering overhead as the list grows. Frequent writes to `chrome.storage.local` also block the service worker's event loop and introduce I/O latency.
**Action:** Use direct `chrome.tabs.sendMessage` for incremental UI updates and debounce storage writes to batch I/O operations.

## 2025-05-15 - [Surgical Content Extraction]
**Learning:** `document.body.cloneNode(true)` is extremely expensive on modern, content-heavy websites. Performing DOM cleaning on a full body clone before identifying the target content is a major performance anti-pattern.
**Action:** Identify candidate content containers on the live DOM using heuristics (text density, paragraph count) before cloning and cleaning ONLY the best candidate.
