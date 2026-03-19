window.onPostDataLoaded({
    "title": "Fix ZIO Fiber Leaks in Persistent Stream Supervision",
    "slug": "zio-fiber-leaks-stream-supervision",
    "language": "Scala",
    "code": "FiberLeak",
    "tags": [
        "Java",
        "Backend",
        "Scala",
        "Error Fix"
    ],
    "analysis": "<p>ZIO Streams that fork long-running processes or fibers using .fork internally can leak resources if the parent stream is interrupted or restarted. If a stream is supervised incorrectly, the child fibers are 'orphaned'\u2014they continue to run in the background because they were detached from the stream's scope. Over time, this consumes the heap and thread pool, eventually leading to OutOfMemoryErrors.</p>",
    "root_cause": "Using .fork or .forkDaemon within a stream without wrapping the execution in ZIO.scoped or using supervised stream operators.",
    "bad_code": "ZStream.fromIterable(data)\n  .mapZIO { item => \n    process(item).fork // Leak: Fiber lives beyond stream iteration\n  }\n  .runDrain",
    "solution_desc": "Use ZIO.scoped to ensure all spawned fibers are tied to the lifetime of the stream, or use .mapZIOPar to manage concurrency without manual forking.",
    "good_code": "ZStream.fromIterable(data)\n  .mapZIOPar(8) { item => \n    process(item) // Managed: ZIO handles fiber lifecycle\n  }\n  .runDrain",
    "verification": "Check the fiber count using ZIO's built-in metrics or a profiler. The fiber count should return to baseline after the stream completes.",
    "date": "2026-03-19",
    "id": 1773883211,
    "type": "error"
});