## 2025-08-28 - Selective Network Interception and O(1) Fragment DOM Log Rendering

**Learning:** Intercepting all fetch/XHR traffic without URL filtering forces response cloning (`response.clone().text()`) and `postMessage` overhead across all non-API traffic (images, telemetry, static assets), severely degrading host page performance in Google AI Studio. Additionally, innerHTML re-renders on high-frequency log updates cause O(N) layout reflows and DOM node churn.

**Action:** Filter network intercepts in main-world scripts using URL pattern matching (`isTargetUrl`) before cloning response streams, and use monotonic sequence counters with `DocumentFragment` and `textContent` for incremental O(1) DOM updates.
