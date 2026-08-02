window.onPostDataLoaded({
    "title": "Fixing Go Runtime GC Pause Spikes from Cgo Pinning",
    "slug": "fixing-go-runtime-gc-pause-spikes-cgo-pointer-pinning",
    "language": "Go",
    "code": "GC_PAUSE_SPIKE",
    "tags": [
        "Go",
        "Cgo",
        "Performance",
        "GC",
        "Error Fix"
    ],
    "analysis": "<p>When passing Go pointers to C through Cgo, the Go runtime pins these objects in memory to prevent the garbage collector (GC) from moving or reclaiming them while C code executes. High-frequency allocations combined with explicit Cgo pointer pinning (via <code>runtime.Pinner</code> or dynamic Cgo boundary checks) cause the GC to scan pinned object trees repeatedly, stalling mark-and-sweep cycles and leading to latency spikes exceeding 100ms.</p>",
    "root_cause": "Passing transient Go pointers into C code requires Cgo runtime checks and pointer pinning. Repeatedly pinning thousands of short-lived Go heap objects per second prevents STW (Stop-The-World) GC mark phase optimization, forcing GC mark workers to repeatedly re-scan pinned memory regions.",
    "bad_code": "package main\n\n/*\n#include <stdlib.h>\nvoid process_bytes(const char* data, int len) {}\n*/\nimport \"C\"\nimport (\n\t\"runtime\"\n\t\"unsafe\"\n)\n\nfunc ProcessData(data []byte) {\n\tp := new(runtime.Pinner)\n\tp.Pin(&data[0]) // Pinning heap pointer passed to C on every fast path request\n\tdefer p.Unpin()\n\tC.process_bytes((*C.char)(unsafe.Pointer(&data[0])), C.int(len(data)))\n}",
    "solution_desc": "Avoid pinning Go heap allocations during Cgo calls by using C-managed memory allocated via C.malloc for high-throughput data paths, or pre-allocate reusable off-heap C memory buffers via sync.Pool to isolate C execution from the Go GC heap entirely.",
    "good_code": "package main\n\n/*\n#include <stdlib.h>\n#include <string.h>\nvoid process_bytes(const char* data, int len) {}\n*/\nimport \"C\"\nimport \"unsafe\"\n\nfunc ProcessData(data []byte) {\n\tlength := C.size_t(len(data))\n\tcMem := C.malloc(length) // Allocate off-heap C memory\n\tdefer C.free(cMem)\n\n\tC.memcpy(cMem, unsafe.Pointer(&data[0]), length)\n\tC.process_bytes((*C.char)(cMem), C.int(length))\n}",
    "verification": "Monitor runtime GC pause metrics using GODEBUG=gctrace=1 and runtime/metrics (specifically /gc/pauses:seconds). Verify latency using go tool pprof trace profiles showing zero runtime.pinner overhead.",
    "date": "2026-08-02",
    "id": 1785666406,
    "type": "error"
});