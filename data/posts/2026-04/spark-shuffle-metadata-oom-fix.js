window.onPostDataLoaded({
    "title": "Spark: Fixing Executor OOMs in Large-Scale Shuffles",
    "slug": "spark-shuffle-metadata-oom-fix",
    "language": "Scala",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When executing Spark jobs with extremely high partition counts (e.g., >50,000 partitions), executors frequently crash with <code>java.lang.OutOfMemoryError: Java heap space</code> during the shuffle read phase. This is often not caused by the data itself, but by the metadata overhead. The <code>MapOutputTracker</code> must track every block location, and the fetch chunk size can lead to buffer bloat when many reducers request data simultaneously from the same executor.</p>",
    "root_cause": "Metadata for high-partition shuffles consumes significant heap memory. Additionally, the default `spark.reducer.maxSizeInFlight` causes executors to pre-allocate large buffers for incoming blocks, leading to heap exhaustion when many concurrent fetch requests occur.",
    "bad_code": "conf.set(\"spark.sql.shuffle.partitions\", \"100000\")\n// Default settings lead to OOM at this scale\nconf.set(\"spark.reducer.maxSizeInFlight\", \"48m\")",
    "solution_desc": "Enable Push-based Shuffle (Spark 3.2+) to reduce the number of small remote fetches. Simultaneously, increase the overhead memory fraction and reduce the fetch buffer size to prevent memory spikes during the shuffle fetch phase. Using Adaptive Query Execution (AQE) to coalesce partitions also helps.",
    "good_code": "conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nconf.set(\"spark.shuffle.push.enabled\", \"true\")\nconf.set(\"spark.reducer.maxSizeInFlight\", \"24m\")\nconf.set(\"spark.memory.offHeap.enabled\", \"true\")\nconf.set(\"spark.memory.offHeap.size\", \"2g\")",
    "verification": "Monitor the 'Shuffle Read Fetch Wait Time' and 'Executor Heap Usage' in the Spark UI to confirm stable memory consumption during the shuffle stage.",
    "date": "2026-04-27",
    "id": 1777287229,
    "type": "error"
});