# Bolt's Journal - Omnipotent Orchestrator Performance

## 2025-05-15 - Initial Performance Audit & Strategy

**Audit:**
- `src/App.tsx`: Sequential `await fetch` in loop during zip generation. Bottleneck: Network waterfall.
- `public/extension-chrome/inject.js`: Global interception of all network traffic without filtering. Bottleneck: Main thread overhead on host page.
- `public/extension-chrome/background.js`: Immediate `chrome.storage.local.set` on every state change. Bottleneck: High disk I/O frequency.
- `public/extension-chrome/aistudio_ui.js` & `popup.js`: O(N) `innerHTML` re-renders of the log list. Bottleneck: DOM thrashing and layout reflows as log history grows.

**Strategy:**
- Parallelize extension asset fetching using `Promise.all`.
- Implement URL-based filtering in `inject.js` to early-exit for non-AI Studio API traffic.
- Debounce background storage persistence (500ms).
- Refactor UI to O(1) incremental log rendering using `DocumentFragment` and a monotonic counter.

**Learning:** Initial audit reveals multiple "death by a thousand cuts" performance issues in the extension's orchestration flow.
**Action:** Apply targeted optimizations to the entire pipeline: from distribution to interception to rendering.
