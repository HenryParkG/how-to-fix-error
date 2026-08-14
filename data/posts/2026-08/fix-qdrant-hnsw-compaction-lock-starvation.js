window.onPostDataLoaded({
    "title": "Fix Qdrant HNSW Segment Compaction Lock Starvation",
    "slug": "fix-qdrant-hnsw-compaction-lock-starvation",
    "language": "Rust",
    "code": "HNSW_COMPACTION_LOCK_STARVATION",
    "tags": [
        "Rust",
        "SQL",
        "Backend",
        "Concurrency",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy vector search workloads on Qdrant, background segment compaction triggers extreme read latency spikes (P99 > 2000ms) or request timeouts. This happens because segment optimization threads acquire exclusive write locks across the segment manager when rebuilding and replacing HNSW graph layers.</p><p>When segments transition from appendable to immutable indexed states, the index builder merges vector payloads and recalibrates nearest neighbor graphs. Holding a coarse-grained exclusive `RwLock` during large graph reconstruction starves search worker threads attempting to acquire read locks for vector traversal, causing read query queues to back up indefinitely.</p>",
    "root_cause": "Long-lived exclusive write locking on the vector segment registry during HNSW graph compaction without atomic segment pointer swapping or lock-free segment snapshots.",
    "bad_code": "use std::sync::{Arc, RwLock};\nuse std::collections::HashMap;\n\npub struct SegmentManager {\n    segments: RwLock<HashMap<usize, Arc<RwLock<VectorSegment>>>>,\n}\n\nimpl SegmentManager {\n    pub fn compact_segments(&self, segment_ids: Vec<usize>) {\n        // BUG: Acquires top-level write lock throughout full HNSW reconstruction\n        let mut manager_guard = self.segments.write().unwrap();\n        let mut merged_segment = VectorSegment::new();\n        \n        for id in segment_ids {\n            if let Some(seg) = manager_guard.remove(&id) {\n                // Heavy synchronous HNSW index rebuild under exclusive lock\n                merged_segment.merge_from(&seg.read().unwrap());\n            }\n        }\n        manager_guard.insert(generate_id(), Arc::new(RwLock::new(merged_segment)));\n    }\n}",
    "solution_desc": "Architect a Copy-On-Write (COW) segment registry using `arc-swap` or epoch-based atomic references. Perform the entire HNSW graph rebuild completely detached from the active segment registry, acquiring an exclusive lock only during the instantaneous atomic pointer swap.",
    "good_code": "use arc_swap::ArcSwap;\nuse std::sync::Arc;\nuse std::collections::HashMap;\n\npub struct SegmentManager {\n    // Lock-free atomic reference to the segment map\n    segments: ArcSwap<HashMap<usize, Arc<VectorSegment>>>,\n}\n\nimpl SegmentManager {\n    pub fn compact_segments(&self, segment_ids: Vec<usize>) {\n        let current_map = self.segments.load();\n        let mut isolated_builder = VectorSegment::new();\n        \n        // Step 1: Read and rebuild outside any global lock\n        for id in &segment_ids {\n            if let Some(segment) = current_map.get(id) {\n                isolated_builder.merge_from(segment);\n            }\n        }\n        \n        let new_segment_id = generate_id();\n        let new_segment = Arc::new(isolated_builder);\n\n        // Step 2: Atomic compare-and-swap update of the active segment snapshot\n        self.segments.rcu(|old_map| {\n            let mut new_map = (**old_map).clone();\n            for id in &segment_ids {\n                new_map.remove(id);\n            }\n            new_map.insert(new_segment_id, Arc::clone(&new_segment));\n            new_map\n        });\n    }\n}",
    "verification": "Run a continuous vector insertion benchmark (5,000 upserts/sec) while simultaneously probing nearest-neighbor queries at 1,000 QPS. Verify with vector query latency histograms that search P99 stays under 15ms during compaction events.",
    "date": "2026-08-14",
    "id": 1786682597,
    "type": "error"
});