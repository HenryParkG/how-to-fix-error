window.onPostDataLoaded({
    "title": "Resolving HNSW Stale-Pointer Crashes in Vector DBs",
    "slug": "hnsw-stale-pointer-vector-db-fix",
    "language": "Rust",
    "code": "Segfault/StalePointer",
    "tags": [
        "Rust",
        "Backend",
        "VectorDB",
        "Error Fix"
    ],
    "analysis": "<p>High-update workloads in vector databases using HNSW (Hierarchical Navigable Small Worlds) often trigger race conditions during neighbor-list updates. When a node is being deleted or re-linked while a concurrent search thread is traversing the graph, the search thread may follow a pointer to a memory address that has already been deallocated or repurposed, resulting in a segmentation fault or corrupted results.</p>",
    "root_cause": "Lack of Epoch-based reclamation or Read-Copy-Update (RCU) semantics when modifying the graph's adjacency lists during high-concurrency write operations.",
    "bad_code": "unsafe {\n    let neighbors = &mut (*node_ptr).neighbors;\n    // Unsafe modification while other threads are reading\n    neighbors.push(new_neighbor_id);\n}",
    "solution_desc": "Implement a crossbeam-epoch based memory management system. Instead of immediate deallocation, mark pointers as 'retired' and only free them when no active threads are in an older epoch, ensuring thread-safe graph traversal without heavy locking.",
    "good_code": "use crossbeam_epoch as epoch;\n\nlet guard = &epoch::pin();\nlet handle = self.nodes[id].load(Ordering::Acquire, guard);\nif let Some(node) = unsafe { handle.as_ref() } {\n    let neighbors = node.neighbors.load(Ordering::Acquire, guard);\n    // Safely traverse neighbors using the guard\n}",
    "verification": "Run a stress test with 100 concurrent search threads and 20 concurrent update/delete threads for 30 minutes. Verify zero crashes and 100% pointer validity.",
    "date": "2026-04-16",
    "id": 1776334109,
    "type": "error"
});