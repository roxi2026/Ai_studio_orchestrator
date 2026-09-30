## 2025-05-15 - Incremental DOM updates for extension log telemetry

**Learning:** Re-rendering fixed capped log lists in Chrome Extension UI scripts via `innerHTML` string interpolation causes full subtree DOM re-parsing and layout reflows on every background state emission.
**Action:** Use a monotonic state counter (`totalLogs`) in background script paired with `DocumentFragment` and `document.createElement`/`createTextNode` in UI scripts to append only new entries in O(1) time while strictly maintaining the 50-entry DOM element cap.
