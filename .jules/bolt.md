## 2025-05-15 - Incremental Log Rendering Pitfalls
**Learning:** When implementing incremental UI updates for a sliding window (e.g., capped at 50 entries), you cannot use the DOM child count as a reliable offset into the state array once the cap is reached. Doing so leads to duplicate entries or failed updates because the DOM count stays constant while the state array grows.

**Action:** Always synchronize based on content identity or unique IDs. For logs, find the index of the last-rendered log in the state array to determine the starting point for the next append batch.
>>>>>>> REPLACE
