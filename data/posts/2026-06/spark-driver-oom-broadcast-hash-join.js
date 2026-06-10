window.onPostDataLoaded({
    "title": "Fixing Spark Driver OOM in Broadcast Hash Join",
    "slug": "spark-driver-oom-broadcast-hash-join",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Spark",
        "Big Data",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>When executing Join queries in Apache Spark, Broadcast Hash Joins (BHJ) are highly optimized because they eliminate shuffle overhead. Spark broadcasts the smaller dataset to all executor nodes. However, prior to broadcasting, the Spark Driver must collect all the partitions of the target table to its local memory to construct the TorrentBroadcast object. When dealing with heavy data skew or underestimating the size of the 'small' table, this collection step exhausts the driver heap memory, throwing a fatal OutOfMemoryError (OOM).</p>",
    "root_cause": "The failure happens because the size of the table to be broadcast exceeds the allocated JVM Heap Space on the Driver node (defined by spark.driver.memory), or data skew creates extremely large partitions that balloon in memory when serialized on the driver, exceeding 'spark.sql.autoBroadcastJoinThreshold'.",
    "bad_code": "// Driver-side OOM triggered by forcing broadcast on skewed, uncompressed data\nDataset<Row> largeTable = spark.read().table(\"user_clicks\");\nDataset<Row> skewedTable = spark.read().table(\"campaigns\"); // Unexpectedly large due to skew\n\n// Forcing a broadcast hash join using join hints on skewed table\nDataset<Row> joined = largeTable.join(skewedTable.hint(\"broadcast\"), \"campaign_id\");\njoined.write().format(\"parquet\").save(\"/output/clicks_by_campaign\");",
    "solution_desc": "To resolve this driver-side bottleneck, you should configure Spark to use Adaptive Query Execution (AQE) skew join optimization. This automatically detects skewed partitions and splits them into smaller sub-partitions. Additionally, you should replace explicit broadcast hints with adaptive thresholds or use join hints to force a SortMergeJoin (SMJ) or ShuffledHashJoin, which processes the joins across the distributed cluster executors rather than gathering data on the single driver node.",
    "good_code": "// Enable Adaptive Query Execution (AQE) and dynamically handle data skew\nspark.conf().set(\"spark.sql.adaptive.enabled\", \"true\");\nspark.conf().set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\");\n// Lower broadcast threshold or rely on SortMergeJoin to safeguard driver memory\nspark.conf().set(\"spark.sql.autoBroadcastJoinThreshold\", \"10485760\"); // Limit to 10MB\n\nDataset<Row> largeTable = spark.read().table(\"user_clicks\");\nDataset<Row> skewedTable = spark.read().table(\"campaigns\");\n\n// Force SortMergeJoin via hint to prevent the Driver from collecting the skewed table\nDataset<Row> joined = largeTable.join(skewedTable.hint(\"merge\"), \"campaign_id\");\njoined.write().format(\"parquet\").save(\"/output/clicks_by_campaign\");",
    "verification": "To verify the fix, monitor the Spark Driver JVM garbage collection metrics and heap utilization in the Spark UI. Run the job and execute `.explain()` on the final DataFrame; verify that the execution plan shows 'SortMergeJoin' or 'ShuffledHashJoin' instead of 'BroadcastHashJoin'.",
    "date": "2026-06-10",
    "id": 1781093952,
    "type": "error"
});