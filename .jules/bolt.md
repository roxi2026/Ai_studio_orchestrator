## 2025-05-15 - [Extension Performance Optimization]
**Learning:** Significant overhead in Chrome extensions often comes from frequent IPC (storage writes) and inefficient DOM manipulation (innerHTML re-renders of growing lists). Network interception without filtering also wastes substantial memory on heavy web apps like AI Studio.
**Action:** Always implement debouncing for storage writes, prefer incremental DOM updates (appendChild) over innerHTML for logs, and use URL-based filtering for network interception to minimize cloning overhead.
