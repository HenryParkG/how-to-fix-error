window.onPostDataLoaded({
    "title": "Resolving Spark Broadcast Hash Join OOM on Skewed Datasets",
    "slug": "spark-broadcast-hash-join-oom-fix",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, a Broadcast Hash Join (BHJ) is the most performant join strategy as it avoids data shuffling. However, it requires the entire broadcasted table to fit within the execution memory of every executor. When dealing with skewed datasets or inaccurate table statistics, Spark may incorrectly choose BHJ for a table that is larger than the available 'spark.driver.maxResultSize' or the executor's memory fraction, leading to fatal OutOfMemory (OOM) errors during the hash table build phase.</p>",
    "root_cause": "The driver-side collection of the broadcast relation exceeded the memory limits, or the uncompressed size of the table in memory was significantly larger than its compressed size on disk used for the threshold calculation.",
    "bad_code": "Dataset<Row> joined = largeTable.hint(\"broadcast\").join(skewedTable, \"id\");\n// Forcing a broadcast on a skewed table that exceeds \n// spark.sql.autoBroadcastJoinThreshold leads to executor OOM.",
    "solution_desc": "Disable the broadcast hint for the skewed table and increase the shuffle partitions. Alternatively, implement 'salting' to redistribute the skewed keys more evenly across partitions, forcing a SortMergeJoin or ShuffledHashJoin instead.",
    "good_code": "// 1. Use Salting to handle skew\nDataset<Row> saltedLeft = largeTable.withColumn(\"salt\", functions.rand().multiply(10).cast(\"int\"));\nDataset<Row> saltedRight = skewedTable.withColumn(\"salt\", functions.explode(functions.sequence(functions.lit(0), functions.lit(9))));\nDataset<Row> fixedJoin = saltedLeft.join(saltedRight, saltedLeft.col(\"id\").equalTo(saltedRight.col(\"id\")).and(saltedLeft.col(\"salt\").equalTo(saltedRight.col(\"salt\"))));",
    "verification": "Check the Spark UI 'SQL' tab to ensure the physical plan shows 'SortMergeJoin' instead of 'BroadcastHashJoin' and monitor executor memory metrics.",
    "date": "2026-04-07",
    "id": 1775545616,
    "type": "error"
});