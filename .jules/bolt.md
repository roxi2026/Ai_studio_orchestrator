# Bolt's Performance Journal

## 2025-08-03 - [O(1) Incremental Rendering & Selective Interception]
**Learning:**
1. Re-rendering lists using raw innerHTML on every state update is a major O(N) performance bottleneck that causes layout thrashing and high CPU usage. Using a monotonic `totalLogs` counter in the state allows extension popups and in-page UI scripts to perform precise O(1) incremental DOM updates with `DocumentFragment` and `document.createTextNode()`.
2. Unconditional cloning and reading of all fetch/XHR network requests on complex pages like Google AI Studio degrades performance due to excessive memory allocations, CPU microtasks, and object cloning. Applying lightweight host-based substring checks (`generateContent`, `v1beta`, `executor`, `reviewer`) allows dropping up to 95% of irrelevant background, telemetry, and asset traffic before cloning or reading response bodies.

**Action:**
- Natively generate static stamps like `[HH:MM:SS]` in the background worker log mechanism rather than on-demand in UI components to prevent UI thread overhead.
- Always use DocumentFragments and incremental DOM append structures instead of `innerHTML +=` for logging UIs.
- Implement early-exit URL-based network interception filtering as early as possible in inject scripts.
