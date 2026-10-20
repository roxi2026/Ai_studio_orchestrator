## 2026-10-20 - Concurrent Asset Retrieval for Client-Side Zip Bundling
**Learning:** Sequential HTTP fetches inside loops create an unnecessary network request waterfall when creating client-side zip bundles from static asset directories.
**Action:** Always fetch multiple static assets concurrently using `Promise.all` before populating JSZip instances to minimize bundle preparation latency.
