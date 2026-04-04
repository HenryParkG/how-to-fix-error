window.onPostDataLoaded({
    "title": "Resolving Spark Executor OOMs during Skewed Hash Joins",
    "slug": "spark-executor-oom-skewed-joins",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, a Hash Join requires the shuffle of data based on a join key. If one specific key (e.g., a null value or a default ID) appears in millions of rows while other keys appear only a few times, a single Spark executor will receive a disproportionately large partition. This causes the executor to exceed its heap memory limit during the build phase of the hash map, resulting in a crash while other executors remain idle.</p>",
    "root_cause": "Data skewness causing a single partition to exceed the physical memory limits of the JVM executor.",
    "bad_code": "val df1 = spark.read.table(\"large_sales\")\nval df2 = spark.read.table(\"dim_store\")\n// Direct join on skewed column 'store_id'\ndf1.join(df2, \"store_id\").write.save(\"output\")",
    "solution_desc": "Apply a 'salting' technique to the join key. Add a random suffix to the skewed key in the large table and replicate the dimension table rows with corresponding suffixes to distribute the load.",
    "good_code": "val saltValue = 10\nval saltedDf1 = df1.withColumn(\"salted_key\", concat($\"store_id\", lit(\"_\"), floor(rand() * saltValue)))\nval saltedDf2 = df2.withColumn(\"explode_col\", explode(array((0 until saltValue).map(lit): _*)))\n  .withColumn(\"salted_key\", concat($\"store_id\", lit(\"_\"), $\"explode_col\"))\n\nsaltedDf1.join(saltedDf2, \"salted_key\").drop(\"salted_key\", \"explode_col\")",
    "verification": "Monitor the Spark UI 'Stages' tab to ensure that the 'Max' task duration and memory usage are close to the 'Median' values.",
    "date": "2026-04-04",
    "id": 1775295047,
    "type": "error"
});