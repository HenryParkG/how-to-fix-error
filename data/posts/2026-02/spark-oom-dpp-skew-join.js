window.onPostDataLoaded({
    "title": "Resolving Spark Executor OOMs via DPP and Skew Joins",
    "slug": "spark-oom-dpp-skew-join",
    "language": "Scala / SQL",
    "code": "ExecutorOOM",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Spark Executor Out-of-Memory (OOM) errors frequently occur during large-scale joins where data distribution is non-uniform. When a specific join key is over-represented (data skew), a single executor is forced to handle a disproportionately large partition, exceeding its heap limits. Additionally, scanning massive tables without pruning unnecessary partitions puts immense pressure on memory and IO.</p>",
    "root_cause": "Data skew causing partition sizes to exceed executor memory and inefficient scanning of partitions that don't satisfy join predicates.",
    "bad_code": "val df1 = spark.table(\"large_sales\") // Skewed on store_id\nval df2 = spark.table(\"dim_store\")\n\n// This join fails if store_id 101 has 50% of records\nval result = df1.join(df2, \"store_id\")",
    "solution_desc": "Enable Dynamic Partition Pruning (DPP) to filter the fact table using the dimension table at runtime. For skew mitigation, use the 'skew' hint in Spark 3.x+ or manually salt the join keys to redistribute data more evenly.",
    "good_code": "spark.conf.set(\"spark.sql.optimizer.dynamicPartitionPruning.enabled\", \"true\")\n\n// Using Skew Hint (Spark 3.0+)\nval result = df1.hint(\"skew\", \"store_id\").join(df2, \"store_id\")\n\n// Manual Salting approach if hints fail\nval saltedDf1 = df1.withColumn(\"salt\", (rand() * 10).cast(\"int\"))\nval saltedDf2 = df2.withColumn(\"salt\", explode(array((0 until 10).map(lit): _*)))",
    "verification": "Monitor Spark UI 'Stages' tab to ensure task processing times are uniform and verify in the 'Environment' tab that DPP is active.",
    "date": "2026-02-25",
    "id": 1772012873,
    "type": "error"
});