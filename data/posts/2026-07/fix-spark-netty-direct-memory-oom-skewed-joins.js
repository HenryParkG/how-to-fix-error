window.onPostDataLoaded({
    "title": "Fix Spark Netty Direct Memory OOM in Skewed Joins",
    "slug": "fix-spark-netty-direct-memory-oom-skewed-joins",
    "language": "Java",
    "code": "FetchFailedException",
    "tags": [
        "Apache Spark",
        "Big Data",
        "Java",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>When executing large-scale joins on dataset keys with high skew, reducer tasks fetch giant partition blocks from mappers. Spark's shuffle infrastructure utilizes off-heap Netty direct memory buffers for network transport. When partition sizes exceed the available off-heap direct memory bounds, Netty fails to allocate chunk buffers, throwing 'java.lang.OutOfMemoryError: Direct buffer memory' which leads to cascading FetchFailedExceptions and stage aborts.</p>",
    "root_cause": "Extreme partition data skew overloading individual executor off-heap Netty memory allocations during shuffle fetch operations.",
    "bad_code": "// Naive join query on heavily skewed join keys without skew mitigation\nDataset<Row> result = df1.join(df2, df1.col(\"skewed_user_id\").equalTo(df2.col(\"skewed_user_id\")));\nresult.write().mode(\"overwrite\").parquet(\"/output/path\");",
    "solution_desc": "Enable Spark Adaptive Query Execution (AQE) with skew join handling to split large partition chunks automatically, and expand off-heap memory overhead via executor configuration settings.",
    "good_code": "SparkSession spark = SparkSession.builder()\n    .appName(\"SkewJoinFix\")\n    .config(\"spark.sql.adaptive.enabled\", \"true\")\n    .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n    .config(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\")\n    .config(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"256MB\")\n    .config(\"spark.executor.memoryOverhead\", \"4g\")\n    .getOrCreate();\n\nDataset<Row> result = df1.join(df2, \"skewed_user_id\");\nresult.write().mode(\"overwrite\").parquet(\"/output/path\");",
    "verification": "Monitor Spark UI 'SQL' tab to verify the appearance of `OptimizeSkewedJoin` nodes in the execution plan and confirm zero Netty direct memory OOM exceptions.",
    "date": "2026-07-28",
    "id": 1785236947,
    "type": "error"
});