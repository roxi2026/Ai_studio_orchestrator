# Bolt's Performance Journal

## 2025-02-14 - Parallelizing Static Extension Bundle Asset Fetching
**Learning:** In frontend distribution portals that assemble zip packages on the client using JSZip, fetching files sequentially in a loop produces a severe network waterfall latency (~12 consecutive round-trips). Fetching all static assets concurrently via `Promise.all` collapses the download preparation phase into a single parallel network flight, reducing asset preparation time by 3x–12x depending on network latency.
**Action:** Always prefer concurrent fetching via `Promise.all` over sequential async loops when assembling multi-file bundles from static paths.
