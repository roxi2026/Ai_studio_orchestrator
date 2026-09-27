## 2026-03-07 - Fast-Path Attribute Checks & Non-Reflowing Text Extractions in Puppet Content Script

**Learning:** In browser extension content scripts executing automated recon commands across arbitrary DOM structures (`puppet_content.js`), using `innerText` on leaf DOM nodes forces synchronous layout reflow calculations. Additionally, evaluating dynamic form input types by concatenating and lowercasing full field context strings for every input creates unnecessary string allocation overhead.

**Action:**
1. Use fast-path attribute checks (`type`, `name`, `id`) in `LocalSLMEngine.inferFieldType` before performing string concatenation and context lowercasing.
2. Query targeted selectors like `a[href]` and use `textContent` instead of `innerText` for leaf node text extraction in `GET_LINKS` and `EXTRACT_SPATIAL` to avoid triggering forced browser layout reflows.
3. Hoist invariant calculations like `clone.textContent.length` outside candidate scoring loops in `READ_ARTICLE`.
