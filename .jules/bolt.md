## 2025-05-22 - [Optimized Asset Loading & High-Efficiency Interception]
**Learning:** Aggressive content filtering of WebSocket streams (e.g., waiting for "done": true) can break core application features like real-time orchestration logging and streaming AI outputs. Filtering should be done at the URL or "pane" level rather than the content level unless the protocol is fully understood and stable.
**Action:** Always prefer URL or metadata-based filtering for network interception to maintain performance without risking data loss for consumers.
