## 2025-05-20 - Target URL Filtering in Main-World Network Interception

**Learning:** Unconditional network interception (`window.fetch` and `XMLHttpRequest`) in main-world injected scripts (`inject.js`) without target URL filtering introduces substantial runtime overhead. Cloning every response stream (`response.clone()`) and extracting body text (`clonedResponse.text()`) for all page network traffic (analytics, static assets, telemetry, external media) creates main-thread CPU spikes and unnecessary window `postMessage` IPC spam.

**Action:** Always filter target URLs against relevant endpoint substrings (`generateContent`, `v1beta`, `executor`, `reviewer`, `prompts`) before cloning responses or dispatching IPC messages.
