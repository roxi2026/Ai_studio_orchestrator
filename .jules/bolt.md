# Bolt's Performance Journal ⚡

## 2025-05-15 - Extension Log Rendering Bottleneck
**Learning:** In the Omnipotent Orchestrator, logs are streamed frequently. The initial implementation used `innerHTML` to re-render the entire log array on every update, which scale to O(N) where N is the number of logs. As the orchestrator runs long sessions, this becomes a major source of UI lag and CPU usage in the extension popup and in-page UI.
**Action:** Always prefer incremental DOM updates (e.g., `appendChild`) for streaming data like logs. Implement a rendering guard that only processes new entries from the state.
