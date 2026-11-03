## 2025-05-15 - Concurrent Asset Fetching for Extension Bundling
**Learning:** Sequential await network fetches inside loops block the main async execution queue, accumulating the network RTT of every file. Concurrently fetching static extension assets via `Promise.all` reduces download preparation latency by ~11-12x.
**Action:** When aggregating multiple static assets for client-side bundle generation (e.g., JSZip), always fetch concurrently using `Promise.all` rather than sequential `for...of` awaits.
