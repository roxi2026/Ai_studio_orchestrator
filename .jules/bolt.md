## 2026-10-17 - Selective Network Interception Routing & O(1) DOM Rendering

**Learning:** Unfiltered fetch/XHR network interception in main-world extension scripts (`inject.js`) clones and parses response bodies for every static asset and telemetry ping, consuming significant CPU cycles and main thread time. Combining URL-selective network filtering with O(1) `DocumentFragment` incremental UI updates and reflow-free DOM extractions (`textContent` vs `innerText`) drastically reduces CPU load and rendering latency.

**Action:** Always filter main-world request interceptions by target endpoint before calling `.clone()` or `.text()`, use monotonic counters (`totalLogs`) for capped sliding-window state rendering, and prefer `textContent` for leaf element reads to avoid forced browser layout reflows.
