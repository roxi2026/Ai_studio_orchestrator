# Bolt Performance Optimization Journal

## 2025-05-18 - Parallel Extension Asset Fetching
**Learning:** In the distribution portal, extension asset files were fetched sequentially using a `for ... of` loop with `await fetch(...)`, causing a network waterfall of 12 sequential HTTP requests. Using `Promise.all` allows fetching all assets in parallel, reducing latency from $O(N \cdot T)$ to $O(T)$.
**Action:** Always use `Promise.all` when fetching multiple independent static assets or API endpoints concurrently to prevent network waterfalls.
