## 2025-05-14 - Telemetry & Interception Optimization
**Learning:** Overriding global `WebSocket` and `XMLHttpRequest` without restoring their prototypes breaks `instanceof` checks in the host application, leading to critical failures in complex React apps like AI Studio.
**Action:** Always ensure `window.WebSocket.prototype = OriginalWebSocket.prototype` (and similar for XHR) when monkey-patching globals to preserve the prototype chain.

**Learning:** Incremental DOM updates (`appendChild`) are significantly faster than full `innerHTML` re-renders, but batch updates (e.g., historical sync) should avoid interleaved layout-triggering operations like `scrollTop` to prevent layout thrashing.
**Action:** Use a `skipScroll` flag or perform a single `scrollTop` update after a batch of DOM insertions.
