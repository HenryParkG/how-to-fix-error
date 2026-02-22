window.onPostDataLoaded({
    "title": "Resolving Spark Data Skew OOMs in Petabyte Joins",
    "slug": "spark-data-skew-oom-shuffle-joins",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Data skew occurs when a small number of join keys account for a disproportionately large amount of data. During a Shuffle Hash Join, Spark hashes keys to specific partitions. If one key (e.g., 'null' or a default value) has billions of rows, a single executor's memory will be overwhelmed, leading to the dreaded 'Executor OOM' while other executors remain idle.</p>",
    "root_cause": "Uneven distribution of data across partitions causes specific executors to exceed their JVM heap memory limits during the shuffle phase of a join operation.",
    "bad_code": "val joinedDF = largeDF.join(skewedDF, \"user_id\")\njoinedDF.write.parquet(\"output/path\")",
    "solution_desc": "Implement 'Salting'. Add a random integer suffix to the join key in the skewed table and replicate the other table's records with all possible salt values. Alternatively, leverage Spark 3.0+ Adaptive Query Execution (AQE) with skew join hints.",
    "good_code": "import org.apache.spark.sql.functions._\nval salt = floor(rand() * 10)\nval skewedSalted = skewedDF.withColumn(\"salted_id\", concat($\"user_id\", lit(\"_\"), salt))\nval largeSalted = largeDF.withColumn(\"salt\", explode(array((0 until 10).map(lit): _*)))\n  .withColumn(\"salted_id\", concat($\"user_id\", lit(\"_\"), $\"salt\"))\nlargeSalted.join(skewedSalted, \"salted_id\")",
    "verification": "Check the Spark UI 'Stages' tab to ensure that the Max Task Duration and Shuffle Read Size are balanced across all executors.",
    "date": "2026-02-22",
    "id": 1771742237,
    "type": "error"
});