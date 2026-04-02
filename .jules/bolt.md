# Bolt's Performance Journal ⚡

## 2025-05-14 - Extension Telemetry & Interception Optimization
**Learning:** The extension currently relies on full DOM re-renders for every log entry and intercepts ALL network traffic in AI Studio without filtering, leading to significant overhead during long-running orchestrations. Frequent storage writes also tax the service worker.
**Action:**
1. Implement incremental log updates in `aistudio_ui.js` using `appendChild` to avoid O(n) re-renders.
2. Filter network interception in `inject.js` to only process AI Studio specific endpoints.
3. Debounce storage writes in `background.js` and use direct message passing for real-time logs.
