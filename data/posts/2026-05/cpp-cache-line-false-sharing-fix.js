window.onPostDataLoaded({
    "title": "Fixing Cache Line False Sharing in C++ Allocators",
    "slug": "cpp-cache-line-false-sharing-fix",
    "language": "C++",
    "code": "PerfRegression",
    "tags": [
        "Rust",
        "Backend",
        "High-Performance",
        "Error Fix"
    ],
    "analysis": "<p>False sharing occurs when multiple threads on different CPU cores modify independent variables that happen to reside on the same cache line (typically 64 bytes). The hardware's MESI cache coherency protocol forces the cache line to be invalidated and reloaded across cores every time one thread writes to its variable, even though the data is logically distinct. In high-performance lock-free allocators, this manifests as a massive performance bottleneck where increasing thread counts actually decreases total throughput.</p>",
    "root_cause": "Memory layout placing frequently modified atomic counters or pointers within the same 64-byte alignment window.",
    "bad_code": "struct ThreadContext {\n    std::atomic<size_t> allocated_bytes; // Shared cache line\n    std::atomic<size_t> freed_bytes;     // Shared cache line\n    // These likely sit in one 64-byte block\n};",
    "solution_desc": "Use the alignas specifier to force specific variables onto their own cache lines, preventing hardware-level contention between threads.",
    "good_code": "struct ThreadContext {\n    alignas(64) std::atomic<size_t> allocated_bytes;\n    alignas(64) std::atomic<size_t> freed_bytes;\n};",
    "verification": "Use 'perf stat -e cache-misses' to measure L1 cache invalidations and verify linear scaling of the allocator under multi-threaded load.",
    "date": "2026-05-01",
    "id": 1777601239,
    "type": "error"
});