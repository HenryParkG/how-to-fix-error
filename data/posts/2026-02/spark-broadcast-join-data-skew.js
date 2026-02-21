window.onPostDataLoaded({
    "title": "Resolving Spark Broadcast Join Skew in Petabyte Shuffles",
    "slug": "spark-broadcast-join-data-skew",
    "language": "Java",
    "code": "DataSkewOOM",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Broadcast joins are a powerful optimization in Apache Spark designed to eliminate expensive shuffles by sending a small table to every executor. However, in multi-petabyte workloads, if the 'small' table exceeds memory limits or the join keys are heavily skewed, executors will throw OutOfMemory (OOM) errors or experience 'straggler' tasks that stall the entire pipeline.</p><p>The primary challenge is that Spark's broadcast threshold is static by default, failing to account for data expansion during decompression or skewed key distribution.</p>",
    "root_cause": "The broadcasted table is too large for the executor's memory overhead, or a single join key has a disproportionately high frequency, causing one executor to process significantly more data than others.",
    "bad_code": "import org.apache.spark.sql.functions.broadcast\n\n// Forcing a broadcast join on a table that might exceed 10MB default\n// or has highly skewed keys\nval joinedDf = largeDf.join(broadcast(potentiallyLargeDf), \"join_key\")\njoinedDf.write.parquet(\"/output/path\")",
    "solution_desc": "Increase the broadcast threshold carefully, but more importantly, use Adaptive Query Execution (AQE) to handle skew. If skew is persistent, 'salt' the join keys by appending a random integer to the key in the large table and replicating the small table keys to match.",
    "good_code": "// 1. Enable Adaptive Query Execution\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n\n// 2. Manual Salting for extreme cases\nimport org.apache.spark.sql.functions.{concat, lit, rand}\n\nval saltedLargeDf = largeDf.withColumn(\"salted_key\", concat($\"join_key\", lit(\"_\"), (rand() * 10).cast(\"int\")))\nval explodedSmallDf = smallDf.withColumn(\"salt\", explode(array((0 until 10).map(lit): _*)))\n    .withColumn(\"salted_key\", concat($\"join_key\", lit(\"_\"), $\"salt\"))\n\nval joinedDf = saltedLargeDf.join(explodedSmallDf, \"salted_key\")",
    "verification": "Monitor the Spark UI 'Stages' tab. Check for uniform task duration and verify that 'Skew' is mitigated via the AQE 'SortMergeJoin' metrics.",
    "date": "2026-02-21",
    "id": 1771636333,
    "type": "error"
});