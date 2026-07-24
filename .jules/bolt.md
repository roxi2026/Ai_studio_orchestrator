# Bolt's Performance Journal

## 2025-02-14 - [O(1) Incremental Rendering & Selective Network Filtering]
**Learning:** Legacy re-rendering of log container lists using `innerHTML` with `Array.prototype.map()` scales quadratically as the history grows, causing significant layout thrashing and high DOM churn. Furthermore, unconditional interception of all network requests (cloning fetch and XHR responses) in injected main-world scripts adds substantial overhead to host page execution.
**Action:** Transition log viewing panes to O(1) incremental rendering via `DocumentFragment` and `document.createTextNode` mapped against a monotonic log counter (`totalLogs`), ensuring DOM elements are capped to 50. Use target-url filtering (`isTargetUrl`) inside injected scripts to exit early and bypass non-relevant requests completely before body cloning or processing.
