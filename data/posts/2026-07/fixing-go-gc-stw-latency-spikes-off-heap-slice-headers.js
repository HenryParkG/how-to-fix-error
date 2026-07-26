window.onPostDataLoaded({
    "title": "Fixing Go GC STW Latency Spikes from Off-Heap Slices",
    "slug": "fixing-go-gc-stw-latency-spikes-off-heap-slice-headers",
    "language": "Go",
    "code": "GCLatencySpike",
    "tags": [
        "Go",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput Go services allocating millions of slice headers on the heap pointing to CGo or off-heap memory trigger severe Stop-The-World (STW) latency spikes during mark termination. Although backing arrays reside off-heap, heap-allocated slice headers force the Go GC scanner to trace millions of 24-byte structs unnecessarily.</p>",
    "root_cause": "Creating []byte slice headers on the heap via unsafe pointer conversion forces Go runtime mark scanning to traverse millions of reflect.SliceHeader / unsafe.Slice structures on the heap, degrading GC mark termination performance despite off-heap backing arrays.",
    "bad_code": "func getOffHeapSlice(ptr unsafe.Pointer, length int) []byte {\n    // Bad: Heap-allocating slice header or letting Go GC track it\n    var sl []byte\n    hdr := (*reflect.SliceHeader)(unsafe.Pointer(&sl))\n    hdr.Data = uintptr(ptr)\n    hdr.Len = length\n    hdr.Cap = length\n    return sl\n}",
    "solution_desc": "Pre-allocate a fixed pool of slice headers or maintain off-heap memory wrappers without heap pointer allocations, reducing Go GC object count down to near zero.",
    "good_code": "type OffHeapBuffer struct {\n    ptr unsafe.Pointer\n    len int\n}\n\n// Using sync.Pool for buffer wrappers to eliminate heap allocations during high concurrency\nvar bufferPool = sync.Pool{\n    New: func() interface{} {\n        return &OffHeapBuffer{}\n    },\n}\n\nfunc (b *OffHeapBuffer) Bytes() []byte {\n    return unsafe.Slice((*byte)(b.ptr), b.len)\n}",
    "verification": "Run `GODEBUG=gctrace=1` and `go test -bench=. -benchmem`. Verify that STW times drop from tens of milliseconds to sub-millisecond, and heap object count (`gc-heap-objects`) remains stable.",
    "date": "2026-07-26",
    "id": 1785061780,
    "type": "error"
});