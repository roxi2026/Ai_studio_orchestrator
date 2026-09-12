## 2025-05-20 - Parallel Extension Asset Bundling
**Learning:** Fetching multiple extension asset files sequentially inside a loop creates a network waterfall bottleneck, multiplying latency across roundtrips.
**Action:** Use `Promise.all` to fetch asset files concurrently before building zip archives.
