window.onPostDataLoaded({
    "title": "Debugging Spark Broadcast Hash Join OOMs under Skew",
    "slug": "spark-broadcast-hash-join-oom-data-skew",
    "language": "Scala/Spark",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Broadcast Hash Join (BHJ) is efficient for joining a small table with a large one by broadcasting the small table to all executors. However, when the join key in the 'small' table is heavily skewed (many rows with the same key), the resulting hash map on the executor exceeds the allocated execution memory. Even if the total table size is below <code>spark.sql.autoBroadcastJoinThreshold</code>, the deserialized in-memory object can be significantly larger, leading to Java Heap Space OOMs.</p>",
    "root_cause": "Data skew leads to a specific hash bucket in the broadcast relation growing beyond the available executor memory during the building of the In-Memory Hash Table.",
    "bad_code": "// Forcing broadcast on a skewed table\nval joinedDF = largeDF.join(broadcast(skewedSmallDF), \"user_id\")",
    "solution_desc": "Disable BHJ for the specific query using a hint or increase the partition count and use a SortMergeJoin. Alternatively, implement 'salting' to break up the skewed keys into smaller chunks that can be handled across multiple tasks.",
    "good_code": "// Use Skew Hint (Spark 3.0+) or Salting\nval joinedDF = largeDF.hint(\"skew\", \"user_id\").join(skewedSmallDF, \"user_id\")\n// Or force SortMergeJoin\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", -1)",
    "verification": "Check the Spark UI Storage tab for 'Size in Memory' of the broadcasted relation and verify that the join strategy changed to 'SortMergeJoin' in the SQL tab.",
    "date": "2026-02-18",
    "id": 1771397581,
    "type": "error"
});