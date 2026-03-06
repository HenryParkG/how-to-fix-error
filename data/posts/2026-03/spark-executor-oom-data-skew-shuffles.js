window.onPostDataLoaded({
    "title": "Mitigating Spark Executor OOMs in Wide Shuffles",
    "slug": "spark-executor-oom-data-skew-shuffles",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Spark OutOfMemory (OOM) errors during wide shuffles (like Joins or GroupBys) are frequently caused by data skew. When a specific key is heavily over-represented in the dataset, all records associated with that key are sent to a single executor partition. This causes that specific executor to exceed its heap memory limits while others remain idle. Traditional scaling (adding more executors) fails because the bottleneck is the size of the largest partition, not the total cluster capacity.</p>",
    "root_cause": "Uneven distribution of data across shuffle partitions (Data Skew), leading to a single task attempting to buffer more data into memory than the 'spark.executor.memory' allows.",
    "bad_code": "// Direct join on a skewed key 'user_id'\nDataset<Row> result = largeSalesDF.join(dimUserDF, \"user_id\");",
    "solution_desc": "Implement 'Salting' to break up the skewed keys. By appending a random integer to the key in the large dataset and exploding the dimension table to match those salted keys, you redistribute the data across multiple partitions.",
    "good_code": "// 1. Salt the large dataset\nDataset<Row> saltedSales = sales.withColumn(\"salt\", floor(rand().multiply(10)));\nsaltedSales = saltedSales.withColumn(\"join_key\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")));\n\n// 2. Explode the dimension table\nDataset<Row> explodedDim = dimUser.withColumn(\"salt_array\", array(0,1,2,3,4,5,6,7,8,9))\n    .withColumn(\"salt\", explode(col(\"salt_array\")))\n    .withColumn(\"join_key\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")));\n\n// 3. Perform the join on the salted key\nDataset<Row> result = saltedSales.join(explodedDim, \"join_key\");",
    "verification": "Check the Spark UI 'Stages' tab. Compare the 'Max' and 'Median' task durations and memory usage. A balanced distribution indicates the skew is mitigated.",
    "date": "2026-03-06",
    "id": 1772789456,
    "type": "error"
});