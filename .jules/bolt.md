## 2025-05-18 - Network Interception Filtering & Web Scraping String Hoisting

**Learning:** Unfiltered fetch/XHR response cloning in extension injection scripts triggers high memory allocation and microtask queue overhead across non-API network traffic (e.g., static assets, fonts, telemetry). Similarly, evaluating `clone.textContent.length` on full-document DOM clones inside candidate scoring loops introduces O(M * N) string concatenation overhead during web extraction.
**Action:** Always filter interceptors by target API URL patterns prior to invoking `.clone()` or `.text()`, and hoist DOM string calculations outside element iteration loops.
