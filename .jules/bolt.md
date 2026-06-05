## 2025-05-15 - O(N) Log Rendering Anti-pattern
**Learning:** The extension was using `innerHTML` to re-render the entire log history (up to 50 entries) on every single message or storage change. This created a performance bottleneck as the session progressed, especially in AI Studio where high-frequency logging occurs.
**Action:** Always prefer `appendChild` for append-only streams like logs. Implement a "sliding window" in the DOM by removing the first child when exceeding a cap to maintain O(1) append performance.

## 2025-05-15 - Verification of IIFE-wrapped Content Scripts
**Learning:** Testing content scripts wrapped in IIFEs headlessly is difficult because internal functions are not exposed.
**Action:** In mock environments, use a "bridge" by mocking `chrome.runtime.onMessage.addListener` BEFORE injecting the script to capture the internal listener and expose it to the test runner.
