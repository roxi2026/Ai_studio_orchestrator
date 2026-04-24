## 2025-05-15 - [Telemetry & State Optimization]
**Learning:** High-frequency logging in browser extensions can lead to significant UI jank and I/O overhead if each log triggers a full DOM re-render and a synchronous storage write. Decoupling the UI update (incremental O(1) append) from the persistence layer (debounced 5s write) dramatically improves responsiveness.
**Action:** Always prefer incremental DOM updates (appendChild) over list-based re-renders for telemetry-style components, and always debounce `chrome.storage` writes when state updates are frequent.
