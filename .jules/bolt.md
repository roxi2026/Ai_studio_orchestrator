# Bolt's Performance Journal

This journal records critical learning points, performance bottlenecks, and architectural insights specific to this codebase.

## 2025-02-18 - Legacy O(N) Log Renderer & Inaccurate Timestamps
**Learning:** The previous implementation reconstructed and fully compiled the logs panel's DOM elements (O(N) layout complexity) using `innerHTML` on every single log array update. Furthermore, the UI mapped each entry and generated a new `Date` instance at render-time. This had two major drawbacks:
1. Significant CPU overhead and layout thrashing as more logs accumulated in the array (capped at 50 but still rendering 50 entries via string manipulation on every tick).
2. Functional bug: All past log items had their rendered timestamp constantly updated to the "current time" of the rendering cycle, completely losing the historical accuracy of the logs.

**Action:** Move timestamp formatting to the service worker (`background.js`) to log once and append a monotonic `state.totalLogs` counter. In the extension UI files (`aistudio_ui.js` and `popup.js`), implement O(1) incremental rendering. Check if `state.totalLogs > lastRenderedTotalLogs`, and if so, slice the new entries, build them dynamically using `document.createDocumentFragment()` with secure and highly efficient `document.createTextNode()`, and cap DOM children to 50 items. This bypasses legacy HTML parser compilation, provides cross-site scripting (XSS) immunity, and executes at speed without layout thrashing.
