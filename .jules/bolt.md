# Bolt's Performance Journal

## 2025-03-06 - Log Rendering DOM Churn & Fetch Interception Overhead
**Learning:** Re-rendering logs with innerHTML on every update causes O(N) DOM churn and triggers heavy layout reflows, which degrades performance as orchestration history grows. In addition, unconditionally cloning every network request and response payload via fetch/XHR interceptors introduces massive memory and CPU overhead on non-AI Studio API endpoints.
**Action:** Transition extension UI logging to an O(1) incremental rendering pattern using DocumentFragment and native text nodes. Introduce URL-based matching filters in the injection layer to selectively intercept only the target AI Studio APIs.
