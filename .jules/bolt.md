## 2025-05-15 - Orchestrator Performance Evolution

**Learning:**
1. Monkey-patching `fetch`/`XHR` for network interception can introduce significant overhead on busy pages if every response is cloned and processed. Filtering by URL pattern BEFORE cloning/reading body is critical for performance.
2. `chrome.storage.local.set` is an asynchronous IPC call that involves disk I/O. Frequent writes (e.g., during logging) should be debounced. 5 seconds is a safe and effective window for non-critical state like logs.
3. DOM `innerHTML` re-renders are $O(N)$ and cause layout thrashing. Using `appendChild` for incremental updates is $O(1)$ and much smoother for high-frequency logs.
4. Parallelizing static asset fetching with `Promise.all` significantly reduces latency in user-triggered bundle generation (ZIP export).

**Action:**
Always implement filtering at the source for interceptors, use debounced storage writes for high-frequency data, and prioritize incremental DOM updates over full re-renders. Use `Promise.all` whenever multiple independent network requests are made.
