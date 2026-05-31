# Bolt's Journal ⚡

## 2025-05-14 - Optimized Orchestrator Telemetry & I/O
**Learning:** O(N) `innerHTML` updates for logs were a significant bottleneck (~4.6ms - 8.6ms per update) which becomes noticeable under rapid orchestration. Switching to O(1) `appendChild` and limiting the DOM to exactly 50 entries ensures constant-time performance regardless of session length. Additionally, frequent `chrome.storage.local.set` calls during rapid logging can saturate extension I/O; debouncing these writes is critical.
**Action:** Use incremental DOM updates (appendChild + textNode) for all real-time telemetry. Always debounce storage writes (e.g., 500ms) in extension service workers to handle burst events efficiently. Filtering network interception in the main world to specific endpoints (v1beta/generateContent) prevents unnecessary host-page overhead.
