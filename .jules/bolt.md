## 2025-07-30 - [Host-Based API Request Filtering & Incremental Log UI Rendering]
**Learning:**
1. Intercepting and parsing all fetch and XHR responses in the host application causes unnecessary cloned response allocations, CPU parsing cycles, and main-thread `postMessage` overhead for non-target requests (e.g. general telemetry, analytics, and heavy static asset requests). Filtering early on normalized URL targets ('generateContent', 'v1beta', 'executor', 'reviewer') before response cloning or text resolution completely eliminates this performance overhead.
2. In Chrome Extensions, frequent UI log container updates using full `innerHTML` re-renders (O(N) operations where N is up to 50 entries) trigger costly HTML parser runs and layout reflows in the popup or injected page DOM on every update. Standardizing on a monotonic state counter (`totalLogs`) allows UI views to perform O(1) incremental rendering via `DocumentFragment` and safe DOM `textContent`/`createTextNode` manipulation, yielding a substantial speedup and improved security.

**Action:**
- In main-world interception scripts, always normalize arguments to a URL string and filter targets early before cloning or processing HTTP response bodies.
- For high-frequency array/list states (e.g. logs, messages) in extension/web UI elements, prefer O(1) appending of diff elements using monotonic indicators and `DocumentFragment` over repeated O(N) `innerHTML` replacement.
