## 2025-05-15 - Monotonic Counter for Sliding Window UI

**Learning:** When using a fixed-size array (sliding window) for logs in the background state, `array.length` cannot be used to determine if the UI needs to append new items once the buffer is full (e.g., capped at 50). Using only the array length would stop all UI updates once the cap is reached.

**Action:** Always implement a monotonic `totalLogs` counter alongside the capped logs array. This allows the UI to calculate exactly how many new entries were added since the last render (`state.totalLogs - lastRenderedTotalLogs`) and slice the array correctly, even when the window is sliding.
