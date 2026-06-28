## 2026-06-28 - Monotonic Counters for Sliding Windows
**Learning:** When implementing incremental UI updates for a sliding window (like a capped log array), array length is not a reliable trigger for updates once the cap is reached. A monotonic counter is required to track the absolute number of items processed.
**Action:** Use a 'totalItems' counter in the state and compare against 'lastRenderedTotal' in the UI to identify and fetch only new items for O(1) rendering.
