window.onPostDataLoaded({
    "title": "Fixing Go GC Latency Spikes in Pointer-Dense Heaps",
    "slug": "go-gc-latency-write-barrier-pointer-dense-heaps",
    "language": "Go",
    "code": "GC Latency",
    "tags": [
        "Go",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Go's concurrent tri-color mark-and-sweep garbage collector relies heavily on write barriers to preserve memory safety during the concurrent mark phase. However, in applications with massive, pointer-heavy heaps (such as in-memory caches or complex graph indexes), write-barrier overhead can lead to devastating latency spikes. When the GC is active, every pointer write triggers a write barrier that forces the mutator thread to assist in tracing. If mutator threads generate allocation and reference changes faster than the background GC workers can trace them, the runtime places mutators into a synchronous 'mark assist' state, causing unpredictable stalls in critical execution paths.</p>",
    "root_cause": "The Go garbage collector must scan every pointer in the heap to determine liveness. When maps or structs contain millions of nested pointers, the overhead of concurrent write barriers during the mark phase escalates. The GC forces active execution threads into 'mark assist' mode to keep up with allocation rates, bottlenecking throughput and causing latency spikes.",
    "bad_code": "package main\n\ntype CacheEntry struct {\n\tID        string\n\tData      []byte\n\tCreatedAt *string // Pointer to string causes unnecessary GC scan depth\n\tMeta      map[string]*string // Highly pointer-dense; forces write barrier on every update\n}\n\ntype Cache struct {\n\titems map[string]*CacheEntry\n}",
    "solution_desc": "Redesign data structures to be entirely pointer-free, or manage allocations off-heap. If a slice, map, or struct contains no pointers, Go's GC completely bypasses scanning it, which eliminates the write-barrier overhead entirely. For example, replace map pointer keys and values with primitive offsets, indices, or flat array representations.",
    "good_code": "package main\n\n// FlatCacheEntry uses primitive offsets and hashes, avoiding pointers entirely.\n// This prevents the Go GC from scanning these objects during the mark phase.\ntype FlatCacheEntry struct {\n\tIDHash      uint64 // Store hash instead of string pointer\n\tDataOffset  uint32 // Offset into a large pre-allocated continuous byte slice\n\tDataLen     uint32\n\tCreatedUnix int64  // Primitive representation of time\n}\n\ntype OptimizedCache struct {\n\t// A map with no pointers in keys or values is flagged as pointer-free by the compiler\n\tentries map[uint64]FlatCacheEntry\n\tstorage []byte\n}",
    "verification": "Compile your code with `go build -gcflags=\"-m\"` to verify escape analysis and struct layouts. Run the application with `GODEBUG=gctrace=1` or profile it using `go tool pprof` during load spikes. Ensure that CPU time spent in `runtime.gcWriteBarrier` and `runtime.gcAssistAlloc` drops close to zero.",
    "date": "2026-07-18",
    "id": 1784359675,
    "type": "error"
});