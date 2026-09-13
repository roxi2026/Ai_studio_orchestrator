## 2025-05-18 - Selective Network Interception in Main-World Content Injection

**Learning:** Intercepting global `fetch` / `XMLHttpRequest` / `WebSocket` without early URL filtering causes severe main-thread overhead during heavy web browsing or AI generation streaming because every single HTTP response (images, telemetry, static assets) triggers stream cloning (`response.clone()`), body reading (`.text()`), and cross-context `postMessage()` serialization.

**Action:** Always apply fast-path regex checks (`/(?:generateContent|v1beta|executor|reviewer|prompts)/i`) on the request target early in interceptor entry points before invoking stream cloning or posting window messages.
