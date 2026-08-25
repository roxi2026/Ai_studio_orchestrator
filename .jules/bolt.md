# Bolt's Journal - Critical Learnings

## 2026-08-25 - Dual Extension Optimization: URL-Filtered Network Interception & O(1) Incremental Rendering

**Learning:** In browser extension content scripts intercepting `window.fetch` / `XMLHttpRequest` for SPAs, blindly cloning responses (`response.clone()`) and parsing bodies (`.text()`) for all requests creates huge memory churn and main-thread GC delays on non-API assets. Furthermore, rendering capped sliding-window state arrays with `innerHTML` causes $O(N)$ DOM churn per update and loses monotonic sequence tracking when the array length reaches its cap.

**Action:** Standardize network interception with lightweight host/URL pattern matching (`isTargetApi`) prior to cloning responses. Pair capped sliding-window array states with a monotonic counter (`state.totalLogs`) in the backend worker to allow extension UIs to compute $O(1)$ delta slices and render incrementally using `DocumentFragment` and `textContent`.
