## 2025-07-06 - Initial Performance Audit

**Learning:** The application has several low-hanging fruits for performance optimization:
1. Extension distribution (App.tsx) fetches assets sequentially.
2. Extension background state is persisted to storage on every log entry without debouncing.
3. Network interception (inject.js) clones and reads every fetch response body regardless of whether it's relevant to the orchestrator.
4. UI log rendering uses `innerHTML` to re-render the entire list on every update.

**Action:** I will prioritize the `App.tsx` parallelization first as it directly impacts the "Speed" of the main entry point, and then look into the extension runtime optimizations if time permits, or focus on the most impactful one. Parallelizing fetches in `App.tsx` is a clear O(N) -> O(1) win for network-bound operations.
