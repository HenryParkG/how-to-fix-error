window.onPostDataLoaded({
    "title": "Resolving Spark Shuffle Block OOM during Skew Joins",
    "slug": "spark-shuffle-block-oom-data-skew",
    "language": "Java",
    "code": "SparkShuffleError",
    "tags": [
        "Java",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, data skew occurs when a specific join key has a disproportionately large number of records compared to other keys. During a Shuffle Hash Join or Sort Merge Join, all records for a given key are sent to a single partition/executor. If one key is massive, that executor's shuffle memory buffer will overflow, leading to an OutOfMemoryError (OOM).</p><p>This is a classic 'long tail' problem in distributed computing where 99% of tasks finish in seconds, but one task hangs or fails because it is processing a 'hot' key (e.g., a Null value or a generic 'Unknown' ID).</p>",
    "root_cause": "Uneven data distribution across join keys causing a single shuffle partition to exceed the executor's memory limits.",
    "bad_code": "// Standard join on a skewed key like 'customer_id'\ndf1.join(df2, \"customer_id\")",
    "solution_desc": "Implement 'Salting'. Add a random integer (salt) to the join key in the skewed dataframe and replicate the other dataframe by the same salt range. This forces the skewed key to be distributed across multiple partitions.",
    "good_code": "// 1. Salt the skewed dataframe\nval saltedDf1 = df1.withColumn(\"salt\", (rand() * 10).cast(\"int\"))\nval saltedDf1Final = saltedDf1.withColumn(\"join_key\", concat(col(\"id\"), col(\"salt\")))\n\n// 2. Replicate the smaller, non-skewed dataframe\nval replicatedDf2 = df2.withColumn(\"salts\", array((0 until 10).map(lit): _*))\n  .withColumn(\"salt\", explode(col(\"salts\")))\n  .withColumn(\"join_key\", concat(col(\"id\"), col(\"salt\")))\n\n// 3. Join on the salted key\nsaltedDf1Final.join(replicatedDf2, \"join_key\")",
    "verification": "Open Spark UI, check the 'Stages' tab, and ensure 'Max' shuffle read size is close to the 'Median' value.",
    "date": "2026-03-15",
    "id": 1773550813,
    "type": "error"
});