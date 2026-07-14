window.onPostDataLoaded({
    "title": "Fixing Spark Driver OOM & Executor Heartbeat Timeouts",
    "slug": "fixing-spark-driver-oom-executor-heartbeat-timeouts",
    "language": "Scala / Spark",
    "code": "OutOfMemoryError / Timeout",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, heavily skewed shuffle operations often trigger a cascade of failures, leading to Executor Heartbeat Timeouts and Driver Out-of-Memory (OOM) errors. When data is skewed (i.e., a few partition keys contain the vast majority of the records), specific executor tasks receive massive partitions. These hot execution tasks suffer from extreme garbage collection overhead, completely blocking execution and preventing the Executor from responding to heartbeats (<code>spark.executor.heartbeatInterval</code>). Meanwhile, the Driver attempts to track large shuffle metadata structures or broadcast giant skewed maps, triggering an Driver OOM. The driver then assumes the unresponsive executor is dead and rescheduled tasks, causing a cascading failure loop.</p>",
    "root_cause": "Imbalanced shuffle partitions (data skew) resulting in extremely large JVM heap utilization on single executors, triggering long Stop-the-World GC pauses that disrupt heartbeats, and causing memory pressure on the driver during data collections or broadcast joins.",
    "bad_code": "import org.apache.spark.sql.functions._\n\nval dfLarge = spark.read.parquet(\"s3://bucket/large_table\") // Skewed key: customer_id\nval dfSmall = spark.read.parquet(\"s3://bucket/small_table\")\n\n// Bad Code: Joining highly skewed data directly triggers major shuffle partitions on a single executor node\nval joinedDf = dfLarge.join(dfSmall, Seq(\"customer_id\"), \"inner\")\njoinedDf.write.mode(\"overwrite\").parquet(\"s3://bucket/output\")",
    "solution_desc": "Enable Adaptive Query Execution (AQE) with skew join mitigation, increase shuffle partitions, adjust the executor heartbeat timeouts to prevent false-positives, and apply a salting technique to distribute skewed keys evenly across multiple executor nodes during processing.",
    "good_code": "import org.apache.spark.sql.functions._\n\n// 1. Configure Adaptive Query Execution (AQE) options\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.executor.heartbeatInterval\", \"100s\") // Prevent false heartbeat timeouts\nspark.conf.set(\"spark.network.timeout\", \"800s\")\n\nval dfLarge = spark.read.parquet(\"s3://bucket/large_table\")\nval dfSmall = spark.read.parquet(\"s3://bucket/small_table\")\n\n// 2. Salt the skewed join key manually for robust distribution\nval saltRange = 10\nval saltedLarge = dfLarge.withColumn(\"salt\", concat(col(\"customer_id\"), lit(\"_\"), round(rand() * (saltRange - 1))))\n\nval explodedSmall = dfSmall.withColumn(\"exploded_salt\", explode(array((0 until saltRange).map(lit): _*)))\n  .withColumn(\"salt\", concat(col(\"customer_id\"), lit(\"_\"), col(\"exploded_salt\")))\n\nval joinedDf = saltedLarge.join(\n  explodedSmall,\n  Seq(\"salt\"),\n  \"inner\"\n).drop(\"salt\", \"exploded_salt\")\n\njoinedDf.write.mode(\"overwrite\").parquet(\"s3://bucket/output\")",
    "verification": "Monitor the Spark UI during execution. Check the 'Tasks' metric page to ensure the maximum execution time of any task is within 2x of the median task time, verifying that the skew is mitigated and no heartbeats are missed.",
    "date": "2026-07-14",
    "id": 1784025075,
    "type": "error"
});