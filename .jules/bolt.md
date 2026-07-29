# Bolt's Journal

## 2026-07-29 - [Optimizing Chrome Extension Event Logging & Main World Interception]
**Learning:**
1. In highly active web apps like Google AI Studio, intercepting network requests (`window.fetch` / `window.XMLHttpRequest`) without strict target filtering causes substantial main thread overhead. Cloning responses and forwarding messages via `postMessage` for static assets and general telemetry causes unnecessary DOM thrashing and CPU spikes.
2. Continually re-rendering list containers (like logs) using `innerHTML` on every state change is an $O(N)$ operation that triggers constant browser layout reflows and garbage collection. Shifting to $O(1)$ incremental rendering with `DocumentFragment` and `document.createTextNode` completely eliminates layout thrashing and prevents XSS.
3. Fetching files sequentially in a loop blocks on network roundtrips. Parallelizing requests with `Promise.all` allows fetching all assets simultaneously, reducing ZIP generation time on the portal.

**Action:**
- Always pre-filter host-page network intercepts based on specific URL substrings before performing resource-intensive operations like response cloning or message posting.
- Manage list elements incrementally by pairing a monotonic counter (e.g., `state.totalLogs`) with local tracked counts (`lastRenderedTotalLogs`) and batch-appending new items using `DocumentFragment`.
- Use `Promise.all` to batch async requests instead of sequential loops.
