## 2025-05-15 - [O(N) Log Rendering Bottleneck]
**Learning:** In extensions where state is synchronized via `chrome.storage.onChanged`, blindly re-rendering large arrays (like logs) using `innerHTML` or mapping creates O(N) DOM churn. For a 50-entry log updated every second, this leads to significant layout thrashing.
**Action:** Use incremental `appendChild` for log updates. Check `newState.logs.length > oldState.logs.length` in the storage listener to only process the delta.

## 2025-05-15 - [Aggressive Fetch Interception Overhead]
**Learning:** Injecting a `fetch` interceptor that clones and reads the body of *every* request (including static assets, analytics, etc.) significantly slows down the host page's network performance.
**Action:** Always implement URL filtering in the interceptor to early-exit for irrelevant endpoints.
