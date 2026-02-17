window.onPostDataLoaded({
    "title": "Fixing Data Races in Go Atomic Pointer Swaps",
    "slug": "go-atomic-pointer-data-race-fix",
    "language": "Go",
    "code": "DataRace",
    "tags": [
        "Go",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>In lock-free state management, developers often use <code>atomic.Pointer</code> or <code>atomic.Value</code> to swap state objects. However, a common pitfall occurs when the developer swaps the pointer but continues to read from or modify the old pointer reference without proper synchronization, or fails to treat the state as immutable. This leads to intermittent data races where one goroutine is writing to a struct field while another is reading the 'old' version that it still holds a reference to.</p>",
    "root_cause": "The race occurs because Go's atomic operations only guarantee the atomicity of the pointer swap itself, not the memory reachable through that pointer. If the underlying data is mutated after being 'published' or while still being accessed by readers, thread safety is violated.",
    "bad_code": "type Config struct { QueryLimit int }\nvar globalCfg atomic.Pointer[Config]\n\n// Goroutine 1: Update\ncfg := globalCfg.Load()\ncfg.QueryLimit = 100 // RACE: Mutation of shared object\n\n// Goroutine 2: Read\nlimit := globalCfg.Load().QueryLimit",
    "solution_desc": "Implement a Copy-on-Write (CoW) pattern. Always treat the object held by the atomic pointer as immutable. To update, load the current pointer, create a deep copy, modify the copy, and then use Compare-And-Swap (CAS) or a simple Swap to publish the new version.",
    "good_code": "type Config struct { QueryLimit int }\nvar globalCfg atomic.Pointer[Config]\n\nfunc UpdateConfig(newLimit int) {\n    for {\n        oldCfg := globalCfg.Load()\n        newCfg := *oldCfg // Shallow copy (ensure deep copy if nested)\n        newCfg.QueryLimit = newLimit\n        if globalCfg.CompareAndSwap(oldCfg, &newCfg) {\n            break\n        }\n    }\n}",
    "verification": "Run tests using the Go Race Detector: `go test -race ./...`. Verify that concurrent reads and writes no longer trigger warnings.",
    "date": "2026-02-17",
    "id": 1771303689,
    "type": "error"
});