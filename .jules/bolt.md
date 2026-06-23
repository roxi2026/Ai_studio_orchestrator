## 2025-06-23 - [Sliding Window Log Rendering Bug]
**Learning:** Incremental UI rendering based on array length (`logs.length`) fails when the source array is a sliding window (e.g., capped at 50 entries using `shift()`). Once the cap is reached, the length stays constant, and the UI stops detecting new entries.
**Action:** Always use an absolute monotonic counter (e.g., `totalLogs`) to track progress and calculate the slice of new items to append to the DOM.
>>>>>>> REPLACE
