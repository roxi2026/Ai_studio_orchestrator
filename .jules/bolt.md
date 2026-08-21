## 2025-05-20 - Parallelize Static Extension Asset Fetching in Download Portal
**Learning:** Sequential `await fetch()` loops for packaging multiple extension files introduce a severe network waterfall latency penalty (12 sequential RTTs).
**Action:** Always use `Promise.all` to fetch static extension assets concurrently when generating zip bundles in distribution portals.
