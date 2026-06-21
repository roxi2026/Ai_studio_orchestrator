## 2025-05-15 - [Sliding Window UI Synchronization]
**Learning:** In extensions where state is a fixed-size sliding window (e.g., last 50 logs), simple `childElementCount` offsets in the UI fail once the cap is reached because the state array's indices no longer correspond to the DOM indices (as the state array shifts but the DOM only appends/removes first).
**Action:** Always synchronize by finding the index of the last-rendered unique element in the new state array before appending missing entries.
