# Bolt's Performance Journal

## 2025-05-18 - Hoisting Subtree Text Calculations in DOM Candidate Scoring

**Learning:** Accessing `textContent` on a top-level container element (like a cloned document body) forces full DOM tree traversal and string concatenation across all descendant nodes. When performed repeatedly inside candidate element evaluation loops (e.g., scoring articles or containers in content scripts), it scales as $O(K \times N)$ for $K$ candidate elements and $N$ DOM nodes.

**Action:** Always compute whole-document/container properties (like total text length or body metrics) once before iterating over DOM candidates, reducing complexity to $O(K + N)$.
