## 2026-10-21 - Network Interception Filtering & O(1) Incremental Log Rendering

**Learning:** Unfiltered fetch/XHR interception in extension main-world injection scripts creates heavy CPU and memory overhead by cloning and parsing responses for every background network request (assets, telemetry, fonts). Furthermore, re-rendering log history via full `innerHTML` string replacement on every state change leads to quadratic $O(N)$ DOM churn and reflow thrashing.

**Action:** Always filter main-world fetch/XHR interceptions by target endpoint URL patterns before cloning response streams, and use a monotonic counter (`totalLogs`) with `DocumentFragment` appends and `textContent` to convert log updates into $O(1)$ operations with zero reflows.
