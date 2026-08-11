window.onPostDataLoaded({
    "title": "Fix Spark Executor OOMs from Hash Partition Skew",
    "slug": "fix-spark-executor-oom-hash-partition-skew",
    "language": "Scala",
    "code": "SparkExecutorOOM",
    "tags": [
        "Apache Spark",
        "Scala",
        "Java",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>When executing distributed joins or aggregations in Apache Spark, an uneven distribution of hash keys causes individual executor partitions to process a disproportionate volume of data. During shuffle spills, these skewed partitions overflow executor memory, triggering java.lang.OutOfMemoryError: Java heap space.</p>",
    "root_cause": "High-frequency join keys (such as nulls or default IDs) route to a single partition during hash shuffling, surpassing executor task memory limits.",
    "bad_code": "val dfJoined = dfOrders.join(\n  dfUsers,\n  dfOrders(\"user_id\") === dfUsers(\"id\"),\n  \"inner\"\n)\ndfJoined.groupBy(\"user_id\").count().write.parquet(\"/tmp/output\")",
    "solution_desc": "Enable Adaptive Query Execution (AQE) skew join optimization in Spark 3+ or apply key salting to uniformly distribute hot keys across multiple shuffle partitions.",
    "good_code": "import org.apache.spark.sql.functions._\n\n// Enable Spark AQE Skew Join\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n\n// Manual Key Salting Pattern for Extreme Skew\nval saltFactor = 16\nval saltedOrders = dfOrders.withColumn(\"salted_id\", \n  concat($\"user_id\", lit(\"_\"), floor(rand() * saltFactor)))\n\nval saltedUsers = dfUsers.withColumn(\"salt_arr\", array((0 until saltFactor).map(lit): _*))\n  .select($\"*\", explode($\"salt_arr\").as(\"salt\"))\n  .withColumn(\"salted_id\", concat($\"id\", lit(\"_\"), $\"salt\"))\n\nval dfJoined = saltedOrders.join(saltedUsers, \"salted_id\")",
    "verification": "Inspect the Spark UI Stages tab post-run and verify that partition read sizes and processing times show uniform distribution without extreme task duration outliers.",
    "date": "2026-08-11",
    "id": 1786430966,
    "type": "error"
});