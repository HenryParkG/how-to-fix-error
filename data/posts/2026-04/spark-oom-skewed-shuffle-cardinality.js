window.onPostDataLoaded({
    "title": "Mitigating Spark Executor OOM from Skewed Shuffles",
    "slug": "spark-oom-skewed-shuffle-cardinality",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Spark Executor OutOfMemory (OOM) errors during shuffle operations are frequently caused by data skew in high-cardinality datasets. When joining or grouping data, Spark hashes the keys to determine which partition the data belongs to. If a single key (e.g., a 'NULL' value or a generic 'GuestID') appears millions of times more than others, a single executor will be overwhelmed by one massive partition while others remain idle.</p><p>This leads to 'FetchFailedExceptions' or direct JVM heap exhaustion because the shuffle block exceeds the 2GB limit or the available execution memory fraction.</p>",
    "root_cause": "The root cause is uneven distribution of keys in a HashPartitioner. High-cardinality keys that occur with high frequency result in 'giant partitions' that exceed the `spark.memory.fraction` allocated for shuffle execution.",
    "bad_code": "// Standard join on a skewed key\nval skewedDf = largeDf.join(smallDf, \"user_id\")\n// This crashes when one user_id has 10M+ records",
    "solution_desc": "Architecturally, we implement 'Salting'. By appending a random integer to the join key in the large dataset and replicating the small dataset with all possible salt values, we force Spark to redistribute the skewed key across multiple partitions.",
    "good_code": "// Adding salt to distribute the skewed key\nval SALT_RANGE = 10\nval saltedLargeDf = largeDf.withColumn(\"salt\", (rand() * SALT_RANGE).cast(\"int\"))\n  .withColumn(\"join_key\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")))\n\nval explodedSmallDf = smallDf.withColumn(\"salts\", array((0 until SALT_RANGE).map(lit): _*))\n  .withColumn(\"salt\", explode(col(\"salts\")))\n  .withColumn(\"join_key\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")))\n\nval result = saltedLargeDf.join(explodedSmallDf, \"join_key\")",
    "verification": "Monitor the Spark UI. Look for the 'Max' vs 'Median' duration and shuffle read size in the Tasks table; they should now be closely aligned.",
    "date": "2026-04-15",
    "id": 1776216473,
    "type": "error"
});