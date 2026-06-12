## 2025-05-15 - Extension Performance Bottlenecks identified
**Learning:** The browser extension uses O(N) rendering for logs (re-rendering the entire list on every update) and performs immediate disk I/O for every log event. Additionally, the network interceptor processes all host traffic regardless of relevance, adding overhead to the AI Studio main world.
**Action:** Transition to incremental O(1) DOM updates for logs, debounce storage persistence, and implement URL-based filtering for network interception.
