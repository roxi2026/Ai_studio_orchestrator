# Bolt's Journal

## 2025-07-17 - Journal Initialized
**Learning:** Always profiling the codebase to identify potential optimizations in performance of both the landing page, bundle/build size, or extension logic is the best way to start.
**Action:** Let's look for critical bottlenecks in extension performance or React frontend loading.

## 2025-07-17 - Incremental O(1) Logging and Network Filtering Evolution
**Learning:** Legacy UI scripts performed O(N) full innerHTML re-renders for every log state change, causing severe layout reflows and memory churn during active sessions. Furthermore, main-world interceptors captured and cloned all network traffic unconditionally, introducing CPU-heavy payload processing. Implementing DocumentFragment incremental appending and host-based URL pattern filtering eliminates the rendering bottleneck and reduces interceptor overhead to near-zero.
**Action:** Always filter main-world injection interceptors to target endpoints and prefer DocumentFragment over innerHTML templates for high-frequency stream rendering.
