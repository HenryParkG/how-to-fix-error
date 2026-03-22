window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Service Memory Fragmentation",
    "slug": "spark-shuffle-service-memory-fragmentation",
    "language": "Java/Scala",
    "code": "MemoryFragmentation",
    "tags": [
        "Java",
        "Spark",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Large-scale Spark jobs involving massive shuffles often trigger OutOfMemory (OOM) errors in the External Shuffle Service (ESS). This is frequently caused by memory fragmentation within Netty\u2019s direct buffer pools. When high-concurrency requests for varying block sizes hit the ESS, the default allocator fails to find contiguous blocks, despite having sufficient total free memory.</p>",
    "root_cause": "Inefficient allocation patterns in Netty's PooledByteBufAllocator combined with high MALLOC_ARENA_MAX settings in the JVM environment.",
    "bad_code": "// Default Spark Conf\nspark.shuffle.service.enabled true\nspark.shuffle.io.serverThreads 128\n# No explicit memory management for Netty",
    "solution_desc": "Tune the Netty allocator by reducing the chunk size and adjusting the MALLOC_ARENA_MAX environment variable. Additionally, switch to 'jemalloc' for the shuffle service to handle fragmentation more gracefully.",
    "good_code": "// Optimized Conf\nspark.shuffle.io.preferDirectBufs false\nspark.shuffle.io.numConnectionsPerPeer 4\n// Env export\nexport MALLOC_ARENA_MAX=4\nexport LD_PRELOAD=/usr/lib/libjemalloc.so",
    "verification": "Check the shuffle service logs for 'Direct buffer memory' errors and use 'jcmd VM.native_memory' to track fragmentation levels.",
    "date": "2026-03-22",
    "id": 1774171458,
    "type": "error"
});