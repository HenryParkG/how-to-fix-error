window.onPostDataLoaded({
    "title": "Fixing Spark Executor Netty Off-Heap Memory Leaks",
    "slug": "spark-executor-netty-offheap-oom",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>During heavy shuffle stages in Apache Spark, executors frequently crash with <code>java.lang.OutOfMemoryError: Direct buffer memory</code> or get killed by the Kubernetes/YARN OOM killer with exit code 137. This issue typically originates in the Netty <code>BlockTransferService</code> where off-heap ByteBuf allocations are retained or pooled without an upper bound when shuffle client connections face intermittent network timeouts.</p>",
    "root_cause": "Netty's pooled direct byte buffers (`PooledByteBufAllocator`) retain off-heap memory allocations across shuffle partition fetches. When network timeouts or executor task retries trigger abrupt channel teardowns, pooled buffers fail to return to the pool promptly, exceeding `spark.executor.memoryOverhead` limits.",
    "bad_code": "# Default vulnerable spark-defaults.conf for shuffle-heavy workloads\nspark.executor.memory 16g\nspark.executor.memoryOverhead 2g\nspark.shuffle.io.preferDirectBufs true\nspark.network.sharedByteBufAllocators.enabled true\nspark.network.timeout 120s",
    "solution_desc": "Disable shared ByteBuf allocators across independent client threads to isolate shuffle pools, reduce reliance on unbounded off-heap allocations, and allocate sufficient overhead memory margin in the JVM container specification.",
    "good_code": "# Optimized spark-defaults.conf mitigating Netty off-heap OOM\nspark.executor.memory 14g\n# Increase overhead to accommodate direct memory burst allocations\nspark.executor.memoryOverhead 4g\n# Prevent global shared Netty pool fragmentation across shuffle threads\nspark.network.sharedByteBufAllocators.enabled false\n# Fall back to unpooled or heap buffers on contention\nspark.shuffle.io.preferDirectBufs false\nspark.network.timeout 300s\nspark.shuffle.io.retryWait 10s\nspark.shuffle.io.maxRetries 5\n# Enable Netty leak detection for debugging if needed\nspark.executor.extraJavaOptions -XX:MaxDirectMemorySize=3g -Dio.netty.leakDetection.level=advanced",
    "verification": "Profile JVM off-heap allocations using Native Memory Tracking (`-XX:NativeMemoryTracking=summary`) and monitor `DirectMemory` usage metrics via Spark Prometheus metrics exporter during full-scale shuffle benchmarks.",
    "date": "2026-08-16",
    "id": 1786861399,
    "type": "error"
});