# Bolt Performance Journal

## 2026-03-07 - Parallel extension packaging and reflow-free DOM extractions
**Learning:** Sequential network fetching in `handleDownload` created multi-RTT latency delays when generating extension downloads. Additionally, querying `innerText` on interactive leaf nodes during batch DOM extractions (`smartAdvance`, `GET_LINKS`, `EXTRACT_SPATIAL`) caused layout thrashing via forced synchronous style recalculations.
**Action:** Use `Promise.all` for parallel asset retrieval and `textContent` on interactive DOM elements during iteration loops.
