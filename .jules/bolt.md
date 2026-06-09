## 2025-05-14 - Optimized Extension Log Pipeline
**Learning:** O(N) innerHTML re-renders of log containers (up to 50 entries) caused significant main-thread jank during high-frequency puppet orchestration. Debouncing storage writes alone isn't enough if the UI still re-renders the entire history on every state change.
**Action:** Use O(1) incremental DOM updates (appendChild) combined with a real-time message broadcast for logs to bypass storage latency and minimize UI overhead.

## 2025-05-14 - Network Interception Overhead
**Learning:** Cloning every fetch/XHR request in AI Studio for interception adds unnecessary memory pressure and latency, especially for tracking and static asset loads.
**Action:** Implement early-exit filtering in the injected script to only process relevant API endpoints (e.g., generateContent).
