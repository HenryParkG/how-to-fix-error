window.onPostDataLoaded({
    "title": "Resolving Spark Executor OOM in Broadcast Joins",
    "slug": "spark-executor-oom-broadcast-join-bloat",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Broadcast Hash Join is designed for performance by sending a small table to all executors. However, an OutOfMemory (OOM) error occurs when the 'small' table, which fits in memory as a compressed Parquet/Avro file, expands significantly once deserialized into a Java Hash Table on the executor's heap.</p>",
    "root_cause": "The `spark.sql.autoBroadcastJoinThreshold` is based on the compressed size on disk, but the in-memory representation (HashMap) can be 5-10x larger due to object overhead and hashing structures.",
    "bad_code": "spark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"100MB\")\n// Join a 90MB compressed table that expands to 1.2GB in RAM\nval result = largeDF.join(broadcast(smallButDenseDF), \"id\")",
    "solution_desc": "Lower the broadcast threshold or explicitly use a SortMergeJoin. Alternatively, increase the executor memory overhead and use 'OFF_HEAP' storage to manage the hash table memory outside the JVM garbage collector's primary sweep.",
    "good_code": "// Reduce threshold or hint for SortMergeJoin\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"20MB\")\nval result = largeDF.hint(\"merge\").join(smallButDenseDF, \"id\")",
    "verification": "Check the Spark UI 'Storage' and 'SQL' tabs to confirm the join type changed to SortMergeJoin and executor heap usage stabilized.",
    "date": "2026-04-29",
    "id": 1777441577,
    "type": "error"
});