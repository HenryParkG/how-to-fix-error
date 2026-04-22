window.onPostDataLoaded({
    "title": "Fix Spark Executor OOMs from Wide Shuffle Skew",
    "slug": "spark-executor-oom-data-skew",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Spark Executor OutOfMemory (OOM) errors during wide shuffles (like Joins or GroupBys) are frequently caused by data skew. When a specific key has significantly more records than others, all those records are sent to a single partition/executor. This overwhelms the executor's memory overhead and execution memory, leading to a crash even if the aggregate cluster memory is sufficient. This is particularly common in 'Long Tail' datasets where a few IDs represent the majority of transactions.</p>",
    "root_cause": "Unbalanced partition sizes during the shuffle phase where one task processes a disproportionately large volume of data compared to its peers.",
    "bad_code": "// Standard join on a skewed key\nval df1 = spark.table(\"large_sales\")\nval df2 = spark.table(\"users\")\nval result = df1.join(df2, \"user_id\") // user_id '0' or 'guest' causes OOM",
    "solution_desc": "Implement 'Salting'. Add a random prefix/suffix to the skewed key in one table and explode the other table to match. This distributes the skewed key across multiple partitions.",
    "good_code": "// Salting the skewed key\nval saltedDf1 = df1.withColumn(\"salted_id\", \n  concat(col(\"user_id\"), lit(\"_\"), round(rand() * 10)))\nval saltedDf2 = df2.withColumn(\"salt\", explode(array((0 to 10).map(lit(_)): _*)))\n  .withColumn(\"salted_id\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")))\nval result = saltedDf1.join(saltedDf2, \"salted_id\")",
    "verification": "Monitor the Spark UI 'Stages' tab. Verify that the 'Max' task duration and 'Max' shuffle read size are close to the 'Median' values.",
    "date": "2026-04-22",
    "id": 1776852912,
    "type": "error"
});