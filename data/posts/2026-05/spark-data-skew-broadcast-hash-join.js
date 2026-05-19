window.onPostDataLoaded({
    "title": "Mitigating Spark Data Skew in Broadcast Joins",
    "slug": "spark-data-skew-broadcast-hash-join",
    "language": "Java",
    "code": "OOM-Skew",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Broadcast Hash Join (BHJ) is efficient for joining a small table with a large one by sending the small table to all executors. However, if the join keys in the large table are heavily skewed (e.g., 90% of rows have the same key), the executor processing that key will crash with an OutOfMemory (OOM) error or cause a massive tail latency.</p><p>Even though the broadcast side is small, the build-side hash table in memory can become a bottleneck during the shuffle-less join process if a single task receives too many rows.</p>",
    "root_cause": "Uneven distribution of join keys where a single partition becomes too large to fit in the executor's memory overhead during the hash join phase.",
    "bad_code": "// Standard join on skewed data\nval joinedDF = largeDF.join(broadcast(smallDF), \"skewed_key\")\njoinedDF.write.parquet(\"/output/path\")",
    "solution_desc": "Implement 'Salting' on the join key. Add a random suffix to the join key in the skewed large table and replicate the entries in the small table to match these suffixes, distributing the load across multiple executors.",
    "good_code": "// Salting the large DF\nval saltedLargeDF = largeDF.withColumn(\"salt\", (rand() * 10).cast(\"int\"))\n    .withColumn(\"join_key\", concat(col(\"skewed_key\"), col(\"salt\")))\n\n// Replicating the small DF\nval saltedSmallDF = smallDF.withColumn(\"salt_array\", array((0 until 10).map(lit): _*))\n    .withColumn(\"salt\", explode(col(\"salt_array\")))\n    .withColumn(\"join_key\", concat(col(\"skewed_key\"), col(\"salt\")))\n\nval result = saltedLargeDF.join(broadcast(saltedSmallDF), \"join_key\")",
    "verification": "Monitor the Spark UI. Look for 'Max' task execution time vs 'Median'. A successful fix shows balanced task durations across executors.",
    "date": "2026-05-19",
    "id": 1779172952,
    "type": "error"
});