window.onPostDataLoaded({
    "title": "Resolve Spark Executor OOM from Broadcast Hash Join Skew",
    "slug": "resolve-spark-executor-oom-broadcast-skew",
    "language": "Spark",
    "code": "OutOfMemoryError: Java heap space",
    "tags": [
        "Java",
        "SQL",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark's Catalyst optimizer leverages Broadcast Hash Joins (BHJ) when one side of a join is estimated to be smaller than <code>spark.sql.autoBroadcastJoinThreshold</code> (default 10MB). In typical executions, the driver collects the small relation and broadcasts serialized byte arrays to all executors, which deserialize it into an in-memory hash table (e.g., <code>HashedRelation</code>).</p><p>Catastrophic OutOfMemory (OOM) errors occur on executors when the broadcast candidate is selected based on inaccurate catalog statistics or compressed data metrics. A table that consumes only 8MB as Snappy-compressed Parquet on disk can expand to hundreds of megabytes or gigabytes when uncompressed in JVM memory. When compounded by key skew (e.g., a high frequency of nulls, empty strings, or default foreign keys), probe-side lookups cause severe garbage collection pauses and eventually exhaust executor memory (<code>Container killed by YARN/K8s for exceeding memory limits</code>).</p>",
    "root_cause": "Inaccurate plan statistics caused an unexpectedly large, compressed dataset to be broadcast, expanding beyond the executor's execution memory fraction and triggering heap exhaustion during hash map materialization.",
    "bad_code": "// Driver-side threshold permits broadcasting up to 100MB\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"104857600\");\n\nDataset<Row> largeLogData = spark.read().parquet(\"s3://logs/access_events\");\nDataset<Row> dimensionTable = spark.read().parquet(\"s3://dims/entities\");\n\n// dimensionTable is 80MB on disk, but expands to 1.8GB in JVM heap!\n// Large skewed join executed with broadcast\nDataset<Row> joined = largeLogData.join(\n    dimensionTable,\n    largeLogData.col(\"entity_id\").equalTo(dimensionTable.col(\"id\")),\n    \"inner\"\n);\njoined.write().mode(\"overwrite\").parquet(\"s3://output/enriched\");",
    "solution_desc": "Disable excessive broadcast thresholds, isolate skewed keys prior to joining using salted keys or two-phase joins, and force Catalyst to use SortMergeJoin or ShuffledHashJoin with Adaptive Query Execution (AQE) skew optimization enabled (`spark.sql.adaptive.skewJoin.enabled=true`).",
    "good_code": "// Configure Adaptive Query Execution to handle skew safely\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\");\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\");\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\");\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"268435456\");\n\n// Keep broadcast join threshold safe (e.g., 10MB)\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"10485760\");\n\nDataset<Row> largeLogData = spark.read().parquet(\"s3://logs/access_events\");\nDataset<Row> dimensionTable = spark.read().parquet(\"s3://dims/entities\");\n\n// Explicitly hint Shuffle Merge Join to prevent executor OOM\nDataset<Row> joined = largeLogData.join(\n    dimensionTable.hint(\"MERGE\"),\n    largeLogData.col(\"entity_id\").equalTo(dimensionTable.col(\"id\")),\n    \"inner\"\n);\njoined.write().mode(\"overwrite\").parquet(\"s3://output/enriched\");",
    "verification": "Inspect the Spark UI SQL tab to confirm the physical plan uses `SortMergeJoin` with `SortExec` rather than `BroadcastHashJoinExec`. Verify in the Executors tab that JVM Heap Memory usage remains stable within the configured safety limits throughout stage execution.",
    "date": "2026-10-24",
    "id": 1792847060,
    "type": "error"
});