## 2025-07-20 - Ultra-Fast Asset Downloading & Log Telemetry Pipeline

**Learning:**
1. Fetching multiple assets sequentially (O(N) round-trips) in UI distribution routes blocks execution and introduces compounding latency. Parallelizing with Promise.all reduces wait times to a single concurrent chunk delivery.
2. Continual full UI logs re-rendering with innerHTML is highly inefficient and creates CPU/DOM churn, as well as introducing XSS vulnerabilities. Moving to DocumentFragment, textContent, and appendChild guarantees O(1) rendering updates.
3. Fetch/XHR interceptors on rich platforms like AI Studio trigger massive noise on unrelated endpoints (assets, telemetry, etc.). Early-exit host URL substring filtering prevents unnecessary cloning, payload reading, and postMessage event loops.

**Action:**
Always parallelize file transfers, batch DOM updates, and aggressively filter interceptors to keep the CPU, memory, and main execution thread fast.
