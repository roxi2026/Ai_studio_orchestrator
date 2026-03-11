## 2025-05-15 - Incremental UI Updates & selective interception
**Learning:** For Chrome extensions interacting with high-traffic pages, global network interception (cloning every response) and full DOM re-renders are major bottlenecks. Debouncing storage writes and using direct messaging for incremental UI updates significantly improves responsiveness.
**Action:** Always filter network interception by URL patterns and prefer `appendChild` over `innerHTML` for list updates.
