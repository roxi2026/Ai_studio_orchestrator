## 2026-05-06 - Optimized Telemetry Engine
**Learning:** High-frequency logging in browser extensions causes major performance degradation due to O(N) DOM re-renders (innerHTML mapping) and synchronous storage writes (chrome.storage.local.set).
**Action:** Always use incremental DOM updates (appendChild) for logging and implement debounced storage writes with a forced maximum delay to ensure state eventually commits without blocking the main thread during rapid orchestration.
