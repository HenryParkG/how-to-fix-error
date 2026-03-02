window.onPostDataLoaded({
    "title": "Resolving Data Skew and OOM in Spark Adaptive Query Execution",
    "slug": "spark-aqe-data-skew-oom-fix",
    "language": "Java",
    "code": "SparkAQE_OOM",
    "tags": [
        "SQL",
        "Infra",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>Spark Adaptive Query Execution (AQE) is designed to optimize query plans at runtime. However, in environments with extreme data skew (e.g., a 'null' key representing 40% of data), AQE's 'skewJoin' optimization can fail if the skewed partition exceeds the 'maxPartitionBytes' or if the shuffle exchange results in a single executor handling a massive spill-to-disk operation.</p><p>This results in OutOfMemory (OOM) errors during the sort-merge join phase because the memory overhead for tracking skewed keys surpasses the available JVM heap.</p>",
    "root_cause": "The root cause is usually a combination of insufficient 'spark.sql.adaptive.advisoryPartitionSizeInBytes' and the failure of the engine to split a single large key that cannot be further subdivided by the default hash partitioner.",
    "bad_code": "SET spark.sql.adaptive.enabled = true;\n-- Default settings often fail on 1TB+ tables with skewed keys\nSELECT * FROM large_fact f \nJOIN dim_table d ON f.user_id = d.user_id;",
    "solution_desc": "Enable explicit skew join handling and adjust the advisory partition size. For extreme cases, implement a 'salting' technique to manually break the skewed key into multiple smaller sub-keys before the join operation.",
    "good_code": "SET spark.sql.adaptive.enabled = true;\nSET spark.sql.adaptive.skewJoin.enabled = true;\nSET spark.sql.adaptive.skewJoin.skewedPartitionFactor = 5;\nSET spark.sql.adaptive.advisoryPartitionSizeInBytes = 128MB;\n-- Salted join if AQE still struggles\nSELECT * FROM (SELECT *, floor(rand()*10) as salt FROM fact) f\nJOIN (SELECT *, explode(sequence(0,9)) as salt FROM dim) d\nON f.user_id = d.user_id AND f.salt = d.salt;",
    "verification": "Monitor the Spark UI 'SQL' tab to ensure 'SortMergeJoin' is replaced with 'SkewJoin' nodes and verify partition size uniformity.",
    "date": "2026-03-02",
    "id": 1772426656,
    "type": "error"
});