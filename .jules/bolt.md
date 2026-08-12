# Bolt's Performance Optimization Journal

## 2026-08-12 - [Initial Journal]
**Learning:** Found that the extension's UI scripts (`aistudio_ui.js` and `popup.js`) re-render their logs using innerHTML inside on-change listeners, resulting in O(N) work with DOM churn and high risk of XSS, especially when the state is updated frequently. Network interception in `inject.js` clones and reads fetch response text unconditionally regardless of destination.
**Action:** Transition both DOM logs to O(1) incremental rendering with DocumentFragments and a 50-entry cap for performance and safety, and optimize network intercept routing with host-based filtering in `inject.js`.
