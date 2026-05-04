window.onPostDataLoaded({
    "title": "Fixing Scala ZIO Fiber Leaks in ZStream",
    "slug": "scala-zio-fiber-leak-fix",
    "language": "Java",
    "code": "ResourceLeak",
    "tags": [
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In ZIO, ZStreams are lazily evaluated. A common mistake is to use <code>fiber.fork</code> inside a <code>mapZIO</code> (or <code>mapM</code>) block. If the stream completes or is interrupted, the forked fibers may continue to run in the background because they were not attached to the scope of the stream lifecycle.</p><p>This leads to 'Fiber Leaks' where memory and CPU usage gradually climb over hours or days in long-running pipelines, eventually leading to an OutOfMemoryError in the JVM.</p>",
    "root_cause": "Unscoped fiber spawning within stream operators without explicit lifecycle management or interruption logic.",
    "bad_code": "ZStream.fromIterable(1 to 1000)\n  .mapZIO { i =>\n    // BUG: This fiber is never joined or interrupted if the stream fails\n    ZIO.logInfo(s\"Processing $i\").fork.as(i)\n  }\n  .runDrain",
    "solution_desc": "Use <code>ZIO.scoped</code> or stream-native concurrency operators like <code>mapZIOPar</code>. If manual forking is required, use <code>forkScoped</code> to ensure the fiber is killed when the stream's scope closes.",
    "good_code": "ZStream.fromIterable(1 to 1000)\n  .mapZIOPar(8) { i =>\n    // Good: Controlled concurrency with automatic cleanup\n    ZIO.logInfo(s\"Processing $i\").as(i)\n  }\n  .runDrain",
    "verification": "Use ZIO-ZMX or a profiler to track the 'Fiber Count' metric. It should remain stable and return to baseline after the stream finishes.",
    "date": "2026-05-04",
    "id": 1777874130,
    "type": "error"
});