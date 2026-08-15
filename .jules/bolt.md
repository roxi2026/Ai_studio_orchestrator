## 2026-08-15 - Main-World Network Interception Filtering

**Learning:** Unconditional network response interception (`response.clone()` and `postMessage` on every `fetch` / `XHR`) in main-world extension scripts introduces significant memory churn and message-bus congestion on complex web applications like Google AI Studio, where static assets, telemetry, and background polling account for >90% of requests.

**Action:** Always filter request URLs against target endpoint patterns (e.g., `generateContent`, `v1beta`) before cloning responses, decoding text, or broadcasting window messages.
