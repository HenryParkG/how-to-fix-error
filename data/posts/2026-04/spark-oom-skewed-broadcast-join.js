window.onPostDataLoaded({
    "title": "Fixing Spark OOMs in Skewed Broadcast Hash Joins",
    "slug": "spark-oom-skewed-broadcast-join",
    "language": "Java",
    "code": "OutOfMemoryError: Java heap space",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Broadcast Hash Joins (BHJ) are the gold standard for performance when joining a small dimension table with a large fact table. However, if the 'small' table contains significant data skew\u2014where a single key appears in millions of rows\u2014the resulting in-memory hash map on the executor will explode in size. Even if the total table size is within the broadcast limit, the memory overhead of the hash map pointers and the concentrated keys leads to an executor OutOfMemoryError (OOM) during the build phase.</p>",
    "root_cause": "Data skew in the broadcasted table results in a hash map that exceeds the 'spark.executor.memoryOverhead' or the allocated execution memory fraction for a single task.",
    "bad_code": "// Forcing a broadcast join on a skewed key distribution\nval joinedDF = factDF.join(broadcast(skewedDimDF), \"join_key\")",
    "solution_desc": "Identify the skewed keys and use a Skew Join Hint (available in Spark 3.0+) to force Spark to split the skewed partitions, or revert to a SortMergeJoin with salting to distribute the load across multiple executors instead of centralizing it in one hash map.",
    "good_code": "// Using Spark 3.x Skew Hint to handle distribution\nval joinedDF = factDF.hint(\"skew\", \"join_key\").join(skewedDimDF, \"join_key\")\n\n// Alternative: Disable broadcast for the specific problematic query\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", -1)",
    "verification": "Check the Spark UI 'Stages' tab. Verify that no single executor shows a significant spike in memory usage compared to others and that 'Peak Execution Memory' is stable.",
    "date": "2026-04-03",
    "id": 1775192470,
    "type": "error"
});