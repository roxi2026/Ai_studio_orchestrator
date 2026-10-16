## 2025-05-20 - Parallel Extension Asset Bundling
**Learning:** Sequential `fetch` calls in asset archiving handlers create a network waterfall (O(N * latency)), blocking zip creation. Using `Promise.all` executes asset fetching in parallel (O(latency)).
**Action:** Always batch asset fetching or independent HTTP requests using `Promise.all` when assembling client-side bundles.
