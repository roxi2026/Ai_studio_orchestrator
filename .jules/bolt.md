## 2026-08-26 - DOM Extraction Reflows and Array Chain Allocations

**Learning:** Accessing `innerText` in extension content scripts (`puppet_content.js`) forces synchronously computed layout / reflow calculations across target web pages. Additionally, extracting links via `document.querySelectorAll('a')` followed by chained array calls (`.filter().map().filter()`) causes excess intermediate array allocations and processes non-link elements.

**Action:** Use `textContent` instead of `innerText` for non-layout extraction commands (`GET_LINKS`, `READ_TEXT`, `EXTRACT_SPATIAL`, `smartAdvance`), and target specific selectors (`a[href]`) with single-pass `for` loop collection.
