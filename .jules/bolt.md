## 2026-08-14 - Selective URL Network Filtering & Incremental Log Rendering

**Learning:** Unconditional network response body cloning (`response.clone()`) and text parsing in main world `inject.js` script incurs heavy memory allocation and main thread execution overhead on Google AI Studio pages during high-frequency asset/telemetry traffic. Furthermore, re-rendering total logs using `innerHTML = state.logs.map(...).join('')` on every state update causes unnecessary layout reflows and DOM re-parsing.

**Action:** Always filter request URLs in `inject.js` before calling `response.clone()` and text decoding to restrict interception to targeted API endpoints (`generateContent`, `v1beta`, `executor`, `reviewer`). Combine this with monotonic counter tracking (`totalLogs`) and `DocumentFragment` incremental appends to achieve O(1) DOM rendering for live logs in extension interfaces.
