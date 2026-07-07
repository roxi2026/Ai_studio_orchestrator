# Bolt's Performance Journal

## 2025-05-15 - [Optimization Suite: I/O, UI, and Network]
**Learning:** Sequential asset fetching during zip generation is a major bottleneck for the distribution portal. In the extension, re-rendering the entire log history with `innerHTML` on every update scales poorly (O(N) where N is log count). Additionally, immediate storage writes for every log entry cause excessive disk I/O.
**Action:** Always use `Promise.all` for batch network requests. Implement incremental DOM updates using `DocumentFragment` and track progress with a monotonic counter to handle sliding window buffers. Debounce storage writes for non-critical state updates.

## 2025-05-15 - [Incremental Rendering with Sliding Windows]
**Learning:** When using a capped array (sliding window) for logs, `state.logs.length` is not a reliable indicator for incremental rendering because it stops increasing once the cap is reached.
**Action:** Implement a monotonic `totalLogs` counter in the source of truth (background state) to accurately calculate the number of new entries to append to the UI, regardless of buffer shifts.
