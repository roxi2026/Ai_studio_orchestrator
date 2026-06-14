## 2025-05-15 - Extension Performance Evolution
**Learning:** The current extension architecture suffers from three major performance bottlenecks: 1) O(N) UI re-rendering of logs using `innerHTML` with unstable timestamps, 2) Excessive I/O due to synchronous `chrome.storage` writes on every log event, and 3) Unfiltered network interception in `inject.js` that clones every fetch response regardless of relevance.
**Action:** Implement structured logging, debounced storage persistence, and targeted network filtering to reduce CPU and I/O overhead.
