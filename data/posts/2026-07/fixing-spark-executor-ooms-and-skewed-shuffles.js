window.onPostDataLoaded({
    "title": "Fixing Spark Executor OOMs and Skewed Shuffles",
    "slug": "fixing-spark-executor-ooms-and-skewed-shuffles",
    "language": "Scala",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Spark",
        "Scala",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, dataset skew is a common performance bottleneck where a small subset of partitions receives the vast majority of the data. During a shuffle stage (such as joins, groupByKey, or reduceByKey), Spark hashes join keys to distribute them. When a high-frequency key (e.g., null values or a generic 'placeholder' ID) is hashed, all associated records are funneled into a single executor. This causes that executor to run out of memory (OOM), triggering container teardowns, while other executors finish instantly and remain idle.</p>",
    "root_cause": "The Spark partitioner maps a key's hash to a target partition index. If a single key is disproportionately present, its target partition size exceeds the executor's JVM heap execution/storage memory limit. This triggers disk spilling, extreme garbage collection overhead, and ultimately a Fatal OutOfMemoryError.",
    "bad_code": "import org.apache.spark.sql.DataFrame\n\n// Performing a join on a heavily skewed key (e.g., user_id has many null/empty values)\nfunc performSkewedJoin(dfA: DataFrame, dfB: DataFrame): DataFrame = {\n  dfA.join(dfB, \"user_id\") // Throws Executor OOM on partition with user_id = \"\"\n}",
    "solution_desc": "Resolve the partition skew by applying a technique called 'salting'. This involves appending a random suffix to the join key of the skewed dataset, thereby spreading the rows across multiple partitions. On the lookup dataset, replicate each row with all possible salt values to ensure matches are preserved. Finally, perform the join and strip the salt from the keys.",
    "good_code": "import org.apache.spark.sql.DataFrame\nimport org.apache.spark.sql.functions._\n\ndef performSaltedJoin(dfA: DataFrame, dfB: DataFrame, saltCount: Int): DataFrame = {\n  // 1. Add salt to the skewed DataFrame\n  val saltedDfA = dfA.withColumn(\"salt\", round(rand() * (saltCount - 1)))\n    .withColumn(\"salted_key\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")))\n\n  // 2. Replicate lookup DataFrame for each salt value\n  val salts = (0 until saltCount).toList\n  val saltedDfB = dfB.withColumn(\"salts\", typedLit(salts))\n    .withColumn(\"salt\", explode(col(\"salts\")))\n    .withColumn(\"salted_key\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")))\n\n  // 3. Join on the salted key and clean up columns\n  saltedDfA.join(saltedDfB, \"salted_key\")\n    .drop(\"salted_key\", \"salt\", \"salts\")\n}",
    "verification": "Monitor the Spark UI. Verify that task execution times across partitions are uniform, and confirm that the shuffle read/write sizes do not show a heavy right-skewed distribution.",
    "date": "2026-07-16",
    "id": 1784179942,
    "type": "error"
});