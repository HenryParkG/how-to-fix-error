window.onPostDataLoaded({
    "title": "Fixing Milvus HNSW Index Segment Consolidation Deadlocks",
    "slug": "fixing-milvus-hnsw-index-segment-consolidation-deadlock",
    "language": "Go",
    "code": "SegmentDeadlock",
    "tags": [
        "Go",
        "Kubernetes",
        "VectorDB",
        "Milvus",
        "Error Fix"
    ],
    "analysis": "<p>Milvus vector database relies on background compaction to consolidate small data segments into larger ones while continually updating HNSW vector indexes. Under dynamic ingestion workloads, dynamic writes push raw vectors to DataNodes while QueryNodes request segment loads for real-time vector search.</p><p>A deadlocking cycle occurs when the `SegmentManager` attempts to acquire an exclusive write lock on a segment state transition while holding a read lock on the index build queue, while the `IndexBuilder` simultaneously acquires a write lock on the index queue waiting for the `SegmentManager` read lock to release. This circular lock dependency causes all streaming vector inserts and queries to hang infinitely.</p>",
    "root_cause": "Unordered concurrent locking between SegmentManager and IndexBuilder worker routines when transitioning segment states from growing to sealed during dynamic compaction.",
    "bad_code": "type SegmentManager struct {\n    mu sync.RWMutex\n    builder *IndexBuilder\n}\n\nfunc (sm *SegmentManager) ConsolidateSegment(segmentID string) {\n    sm.mu.Lock() // Acquires SegmentManager lock first\n    defer sm.mu.Unlock()\n    \n    // Locks IndexBuilder queue internally while holding SegmentManager lock\n    sm.builder.RegisterSegmentIndex(segmentID)\n}\n\nfunc (ib *IndexBuilder) RegisterSegmentIndex(segmentID string) {\n    ib.mu.Lock() // Re-locks IndexBuilder lock\n    defer ib.mu.Unlock()\n}",
    "solution_desc": "Refactor segment consolidation to follow a strict top-down locking hierarchy with non-blocking try-lock mechanisms or asynchronous notification channels, eliminating cross-module synchronous lock acquisitions.",
    "good_code": "type SegmentManager struct {\n    mu sync.RWMutex\n    indexTaskChan chan string // Decouple using non-blocking channel\n}\n\nfunc (sm *SegmentManager) ConsolidateSegment(ctx context.Context, segmentID string) error {\n    {\n        sm.mu.Lock()\n        // Perform internal state update only\n        sm.mu.Unlock()\n    }\n    \n    // Asynchronously notify IndexBuilder outside critical section\n    select {\n    case sm.indexTaskChan <- segmentID:\n        return nil\n    case <-ctx.Done():\n        return ctx.Err()\n    }\n}",
    "verification": "Run a continuous vector insertion script with `milvus-sdk-python` while triggering forced compaction through Milvus Management REST APIs, checking for zero deadlocked routines via `pprof` stack traces.",
    "date": "2026-08-01",
    "id": 1785563181,
    "type": "error"
});