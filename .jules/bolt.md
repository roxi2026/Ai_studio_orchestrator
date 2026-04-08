## 2025-05-14 - Efficient Orchestration Pipeline
**Learning:** Redundant storage writes and O(n) UI re-renders significantly impact extension performance during high-frequency logging. Direct message broadcasting bypasses storage latency for real-time updates.
**Action:** Implement debouncing for storage I/O and use incremental DOM updates (appendChild) instead of innerHTML for log lists. Filter network interception at the source to reduce main-thread overhead.
