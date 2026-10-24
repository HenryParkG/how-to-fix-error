window.onPostDataLoaded({
    "title": "Fix Go GC Mark Termination Spikes from Tiny Alloc",
    "slug": "go-gc-mark-termination-tiny-allocator",
    "language": "Go",
    "code": "GC-STW-LATENCY",
    "tags": [
        "Go",
        "Performance",
        "MemoryManagement",
        "Error Fix"
    ],
    "analysis": "<p>Go's garbage collector is concurrent, running alongside application goroutines with target Stop-The-World (STW) pauses well under a millisecond. However, applications handling high-throughput telemetry or deserialization can experience sudden multi-millisecond spikes during Mark Termination.</p><p>Go's memory allocator allocates objects smaller than 16 bytes with no pointers using a specialized 'tiny allocator' into unified 16-byte slots across <code>mspan</code>s. When millions of tiny allocations are continuously created and held across short-to-medium lifecycles, the runtime cannot sweep spans cleanly because isolated tiny allocations pin the entire 8KB span. During the GC Mark Termination phase, clearing per-P local caches (mcache) and draining residual mark queues forces the runtime to stall while scanning highly fragmented spans.</p>",
    "root_cause": "Tiny allocator fragmentation forces high per-P span flushing and mark barrier drain overhead during Mark Termination, turning sub-millisecond STW phases into multi-millisecond latency spikes.",
    "bad_code": "package main\n\nimport \"sync\"\n\ntype MetricPayload struct {\n\tID    uint32\n\tValue float32\n}\n\nfunc ProcessBatch(items []MetricPayload, out chan<- *MetricPayload) {\n\tfor _, item := range items {\n\t\t// Individual allocation for tiny (8-byte) struct.\n\t\t// Rapidly exhausts tiny allocator spans and causes severe fragmentation.\n\t\tentry := new(MetricPayload)\n\t\t*entry = item\n\t\tout <- entry\n\t}\n}",
    "solution_desc": "Mitigate fragmentation by pre-allocating slab slices or using sync.Pool with slice buffers to bypass the runtime tiny allocator completely. Allocating in batches ensures contiguous memory layout and dramatically reduces mspan fragmentation and mark root tracking.",
    "good_code": "package main\n\nimport \"sync\"\n\ntype MetricPayload struct {\n\tID    uint32\n\tValue float32\n}\n\nvar batchPool = sync.Pool{\n\tNew: func() any {\n\t\tslice := make([]MetricPayload, 0, 1024)\n\t\treturn &slice\n\t},\n}\n\nfunc ProcessBatchPooled(items []MetricPayload, out chan<- []MetricPayload) {\n\tbufPtr := batchPool.Get().(*[]MetricPayload)\n\tbuf := (*bufPtr)[:0]\n\n\tfor _, item := range items {\n\t\tbuf = append(buf, item)\n\t\tif len(buf) == cap(buf) {\n\t\t\tout <- buf\n\t\t\tbufPtr = batchPool.Get().(*[]MetricPayload)\n\t\t\tbuf = (*bufPtr)[:0]\n\t\t}\n\t}\n\tif len(buf) > 0 {\n\t\tout <- buf\n\t}\n}",
    "verification": "Execute workload with GODEBUG=gctrace=1 and analyze trace using 'go tool trace trace.out'. Verify that 'GC (STW mark termination)' duration drops from >10ms back to sub-100\u00b5s intervals.",
    "date": "2026-10-24",
    "id": 1792809355,
    "type": "error"
});