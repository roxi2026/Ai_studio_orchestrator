## 2025-05-14 - Optimized Extension Orchestration & UI Performance

**Learning:** Intercepting and cloning all network requests (`fetch`/`XHR`) in a high-traffic app like AI Studio causes significant CPU overhead and memory pressure. Additionally, using `innerHTML` to re-render log lists on every state change leads to layout thrashing and poor responsiveness during orchestration.

**Action:**
1. Implement URL-based filtering in `inject.js` to only process relevant orchestration traffic.
2. Use incremental DOM updates (`appendChild` + `createTextNode`) for real-time telemetry instead of full re-renders.
3. Add a fallback sync mechanism to `aistudio_ui.js` to reconcile the UI state with storage if incremental updates diverge.
4. Debounce storage writes in `background.js` to batch high-frequency state updates.
