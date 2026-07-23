window.onPostDataLoaded({
    "title": "Fixing Spark Driver OOMs in Broadcast Hash Joins",
    "slug": "fixing-spark-driver-ooms-in-broadcast-hash-joins",
    "language": "Scala / Apache Spark",
    "code": "java.lang.OutOfMemoryError",
    "tags": [
        "Apache Spark",
        "Java",
        "SQL",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>During Broadcast Hash Joins (BHJ) in Apache Spark, the driver node collects the entire broadcast dataset from executors before serializing and broadcasting it across the cluster. When data skew occurs or table statistics are inaccurate, Spark may broadcast a dataset much larger than anticipated, exceeding driver memory limits and causing `java.lang.OutOfMemoryError: Java heap space` failures.</p>",
    "root_cause": "Spark SQL explicit broadcast hints override safe size limits, forcing the driver node to collect massive partition payloads into JVM memory.",
    "bad_code": "// Forcing a broadcast join on an un-profiled large dataset\nval dimUserDF = spark.read.table(\"dim_users\") // Actual size 5GB\nval factEventsDF = spark.read.table(\"fact_events\")\n\n// Driver attempts to collect dimUserDF into heap memory\nval joinedDF = factEventsDF.join(broadcast(dimUserDF), \"user_id\")\njoinedDF.write.parquet(\"s3a://analytics/joined\")",
    "solution_desc": "Remove forced explicit broadcast hints, enable Adaptive Query Execution (AQE), set accurate broadcast thresholds, and let Spark dynamically decide join strategies or handle key skew.",
    "good_code": "// Enable Adaptive Query Execution to handle joins safely\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewedJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"104857600\") // 100MB\n\nval dimUserDF = spark.read.table(\"dim_users\")\nval factEventsDF = spark.read.table(\"fact_events\")\n\n// Safe dynamic join strategy decision\nval joinedDF = factEventsDF.join(dimUserDF, \"user_id\")\njoinedDF.write.parquet(\"s3a://analytics/joined\")",
    "verification": "Inspect the Spark UI SQL execution graph; confirm skew handling is triggered and joins transition dynamically to SortMergeJoin when broadcast size exceeds limits.",
    "date": "2026-07-23",
    "id": 1784771630,
    "type": "error"
});