## 2026-09-29 - Parallel Asset Fetching in Distribution Portal
**Learning:** Sequential `for...of` fetching of extension static assets creates a network waterfall bottleneck during zip archive generation.
**Action:** Use `Promise.all` over `files.map` to perform concurrent asset fetches, reducing zip generation wall time to `max(RTT)` instead of `sum(RTT)`.
