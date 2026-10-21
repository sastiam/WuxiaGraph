## 2026-10-21 - Eliminate $O(N^2)$ DB & Adjacency List Reconstructions in `getAffinityMatrix`
**Learning:** `getAffinityMatrix` called `findShortestPath` $N \times (N-1)$ times, each triggering `graphRepo.getAllRelationships()` and building an adjacency list.
**Action:** Fetch relationships and build the adjacency list once at the start of `getAffinityMatrix` (or perform single-source BFS), reducing DB calls from $O(N^2)$ to $O(1)$.
