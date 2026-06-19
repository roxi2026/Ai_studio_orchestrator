## 2025-05-22 - Sliding Window Incremental Sync
**Learning:** In the Omnipotent AI Orchestrator, log state is capped at 50 entries. Incremental rendering based on simple indices (e.g., `DOM.children.length`) fails as soon as the state array shifts (pops the first element) because the index no longer maps to the same logical entry.
**Action:** Use unique identifiers (like timestamps) attached to DOM nodes via `dataset` to perform O(1) synchronization. Find the last rendered timestamp in the new state array to determine the correct slice for appending new entries.
