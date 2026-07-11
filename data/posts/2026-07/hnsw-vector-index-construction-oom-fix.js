window.onPostDataLoaded({
    "title": "Mitigating HNSW Vector Index Construction OOMs",
    "slug": "hnsw-vector-index-construction-oom-fix",
    "language": "Rust",
    "code": "VectorDB-OOM",
    "tags": [
        "Rust",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the standard algorithm for Approximate Nearest Neighbor (ANN) search in vector databases. However, during index building or background segment consolidation (merging multiple segments/indexes), memory consumption scales quadratically with database size if not carefully bounded. During segment merging, systems must load adjacent nodes, their multi-layer link lists, and calculate distance metrics in-memory. Under highly parallel workloads, the lack of resource limits on graph layers combined with unbounded system allocator allocations results in kernel Out-of-Memory (OOM) kills.</p>",
    "root_cause": "Uncapped construction parameters (M and ef_construction) combined with concurrent index consolidation tasks that allocate unstructured dynamic memory without resource-bounded pooling or off-heap memory-mapped (mmap) file backing.",
    "bad_code": "use std::collections::HashMap;\n\nstruct HNSWBuilder {\n    ef_construction: usize,\n    m: usize,\n    // In-memory heap-allocated index map\n    nodes: HashMap<usize, Vec<Vec<usize>>>,\n}\n\nimpl HNSWBuilder {\n    // Naive consolidation loads all segments into heap space with no memory bounding\n    fn merge_segments(&mut self, other_segments: Vec<HNSWBuilder>) {\n        for mut segment in other_segments {\n            for (node_id, layers) in segment.nodes.drain() {\n                // Unbounded heap insertion during multi-threaded merges triggers OOM\n                self.nodes.insert(node_id, layers);\n            }\n        }\n    }\n}",
    "solution_desc": "Architect a memory-aware builder that limits active memory footprint. Utilize memory-mapped files (using the `memmap2` crate) to keep index nodes disk-backed while caching hot layers in-memory. Enforce strict resource budgets using semaphores for background index builders and rate-limit concurrent segment consolidations.",
    "good_code": "use std::fs::File;\nuse std::io::{Write, Result};\nuse memmap2::MmapMut;\n\nstruct BoundedHNSWBuilder {\n    ef_construction: usize,\n    m: usize,\n    // Memory-mapped file storing node connection tables securely on disk\n    mmap_storage: MmapMut,\n    max_bytes: usize,\n}\n\nimpl BoundedHNSWBuilder {\n    pub fn new(file: File, max_bytes: usize, m: usize, ef: usize) -> Result<Self> {\n        // Allocate physical file size bound to enforce absolute memory protection\n        file.set_len(max_bytes as u64)?;\n        let mmap = unsafe { MmapMut::map_mut(&file)? };\n        Ok(Self {\n            ef_construction: ef,\n            m,\n            mmap_storage: mmap,\n            max_bytes,\n        })\n    } \n\n    pub fn write_link(&mut self, offset: usize, target: &[u8]) {\n        // Bounds check writing directly to the disk-backed virtual address space\n        if offset + target.len() <= self.max_bytes {\n            self.mmap_storage[offset..(offset + target.len())].copy_from_slice(target);\n        }\n    }\n}",
    "verification": "Profile memory allocation using jemalloc profiling or valgrind tools during stress tests. Build indexes with dynamic sizing up to 10M vectors, checking that memory usage remains flat as disk I/O increases.",
    "date": "2026-07-11",
    "id": 1783747970,
    "type": "error"
});