## 2025-05-14 - Optimized Logging and Storage System
**Learning:** O(n) rendering of log history with innerHTML and map() is a major bottleneck during high-frequency orchestration. Immediate storage writes for every log entry cause unnecessary disk I/O pressure.
**Action:** Use O(1) appendChild for incremental log updates and implement a debounce (500ms) for storage writes to batch state updates.

## 2025-05-14 - UI Sync Logic for Capped Buffers
**Learning:** When using a capped log buffer (e.g., 50 entries), simply comparing array lengths is insufficient to detect state changes once the buffer is full.
**Action:** Always compare the content of the last log entry (or a unique ID/timestamp) to detect when a full sync from storage is required in capped UI components.
