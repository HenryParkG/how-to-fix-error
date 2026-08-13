window.onPostDataLoaded({
    "title": "Fix Spark Driver OOMs From Broadcast Join Skew",
    "slug": "spark-driver-oom-broadcast-join-skew",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Spark",
        "SQL",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark broadcast joins optimize query execution by collecting the smaller relation into the driver's JVM heap and broadcasting it to all worker nodes. However, when dataset statistics are inaccurate or data cardinality is heavily skewed, Spark's query planner wrongly selects a Broadcast Hash Join for a relation that exceeds driver memory. During `BroadcastExchangeExec`, the driver attempts to collect and serialize the entire skewed relation into heap storage, causing `java.lang.OutOfMemoryError: Java heap space`.</p>",
    "root_cause": "Dynamic data growth or stale metastore table statistics cause Spark query planner to underestimate join relation size, falling back to Broadcast Hash Join on heavily skewed partitions.",
    "bad_code": "// Skewed high-cardinality broadcast join leading to Driver OOM\nval targetDF = largeDataset.join(\n  skewedDimensionDF.hint(\"broadcast\"), // Explicit force broadcast on skewed key\n  Seq(\"user_id\"),\n  \"inner\"\n)\ntargetDF.write.mode(\"overwrite\").parquet(\"/output/path\")",
    "solution_desc": "Enable Adaptive Query Execution (AQE) with automatic skewed join handling, enforce threshold sanity checks on `spark.sql.autoBroadcastJoinThreshold`, and salt skewed join keys to convert the operation into a distributed SortMergeJoin.",
    "good_code": "import org.apache.spark.sql.functions._\n\n// Enable Adaptive Query Execution and Skew Join Handling\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"10MB\") // Disable automatic massive broadcast\n\n// Salt join keys to eliminate cardinality skew before join\nval saltedLarge = largeDataset.withColumn(\"salt\", expr(\"floor(rand() * 4)\"))\nval saltedDim = skewedDimensionDF.withColumn(\"salt\", explode(array((0 until 4).map(lit): _*)))\n\nval resultDF = saltedLarge.join(\n  saltedDim,\n  Seq(\"user_id\", \"salt\"),\n  \"inner\"\n).drop(\"salt\")\n\nresultDF.write.mode(\"overwrite\").parquet(\"/output/path\")",
    "verification": "Inspect the Spark UI SQL DAG tab to verify execution uses `SortMergeJoin` with `AdaptiveSparkPlan`. Check driver memory metrics during action execution to verify flat memory profile.",
    "date": "2026-08-13",
    "id": 1786605247,
    "type": "error"
});