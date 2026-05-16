window.onPostDataLoaded({
    "title": "Fixing Spark OOM from Skewed Shuffle Buffers",
    "slug": "spark-oom-skewed-partition-shuffle",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark shuffles data across the network during join or aggregation operations. If a specific key is highly frequent (data skew), the partition associated with that key becomes massive.</p><p>When an executor attempts to buffer this skewed partition in memory before writing to disk or during the reduce phase, it exceeds the allocated 'spark.executor.memory', leading to a Heap Space OutOfMemoryError. This is common in multi-tenant environments where join keys follow a power-law distribution.</p>",
    "root_cause": "Uneven distribution of data across partitions causes specific shuffle blocks to exceed the size of the allocated shuffle execution memory fraction.",
    "bad_code": "// Standard join on skewed data\ndf1.join(df2, \"user_id\").groupBy(\"user_id\").count().collect();",
    "solution_desc": "Enable Adaptive Query Execution (AQE) and its skew join optimization feature. This allows Spark to split skewed partitions into smaller sub-partitions automatically.",
    "good_code": "// Enable AQE Skew Join Optimization\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\");\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\");\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"256MB\");\n\ndf1.join(df2, \"user_id\");",
    "verification": "Monitor the Spark UI 'Stages' tab to see if 'skewed' partitions are being split and if the 'Max' shuffle read size is closer to the 'Median'.",
    "date": "2026-05-16",
    "id": 1778926073,
    "type": "error"
});