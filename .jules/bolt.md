## 2025-05-14 - Chrome Extension Performance Evolution

**Learning:** Large-scale Chrome extensions can suffer from significant IPC and I/O overhead when frequently syncing large state objects to storage or broadcasting them to multiple content scripts. Furthermore, aggressive DOM re-rendering using `innerHTML` in logs or telemetries leads to "jank" as the session progresses.

**Action:**
1. Always debounce storage writes (`chrome.storage.local.set`) if they are triggered by frequent events like logging.
2. Use direct message passing (`chrome.tabs.sendMessage`) for incremental UI updates instead of relying solely on `chrome.storage.onChanged` for real-time feedback.
3. Optimize DOM updates in log views by using `appendChild` and `DocumentFragment` to avoid full `innerHTML` re-renders.
4. Implement selective network interception in `inject.js` to avoid the overhead of cloning/reading responses that are not relevant to the extension's core logic.

**Additional Learning (Refinement):** Direct message passing architectures require robust target identification (e.g., `brainTabId`). Always update the target ID on every incoming message from the client to ensure the communication channel remains active after page reloads or navigation. Implement a fallback sync mechanism in the UI that triggers a full re-render only when the local DOM significantly lags behind the stored state.
