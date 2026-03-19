window.onPostDataLoaded({
    "title": "Resolving Spark Executor OOMs in Broadcast Joins",
    "slug": "spark-executor-oom-broadcast-hash-join",
    "language": "Scala/Spark",
    "code": "OutOfMemoryError",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Broadcast Hash Join (BHJ) is efficient but prone to failure when the 'small' side of the join is larger than expected or when data skew exists. When a table is broadcast, it is sent to every executor and stored in the execution memory. If multiple tasks on the same executor attempt to build the hash table simultaneously, or if the serialized size exceeds the 'spark.driver.maxResultSize', the executor or driver will crash with an OOM error.</p>",
    "root_cause": "The broadcasted relation exceeds the available execution memory fraction of the executor's JVM heap, often triggered by inaccurate table statistics or high cardinality in the join keys.",
    "bad_code": "val joinedDF = largeDF.join(broadcast(smallSkewedDF), \"join_key\")\n// smallSkewedDF is actually 2GB, exceeding executor memory overhead",
    "solution_desc": "Increase the 'spark.sql.autoBroadcastJoinThreshold' or explicitly disable the broadcast hint for skewed datasets. For data skew, implement salting or leverage Spark 3.x Adaptive Query Execution (AQE) to automatically detect and handle skewed joins by splitting partitions.",
    "good_code": "spark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n\nval joinedDF = largeDF.hint(\"SHUFFLE_MERGE\").join(smallDF, \"join_key\")\n// Forces SortMergeJoin which is more stable for large/skewed data",
    "verification": "Monitor the Spark UI 'Executors' tab. Check if 'Peak Execution Memory' per task is within limits. Verify that 'Shuffle Read Size' is balanced across partitions.",
    "date": "2026-03-19",
    "id": 1773895806,
    "type": "error"
});