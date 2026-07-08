## 2025-05-15 - [Extension UI Performance]
**Learning:** Sequential `innerHTML` re-renders for logs create O(N²) layout thrashing as the log history grows. Parallelizing asset fetching and debouncing storage writes are critical for extension responsiveness.
**Action:** Always use `DocumentFragment` and `createTextNode` for incremental UI updates. Parallelize network requests in build/distribution scripts.
