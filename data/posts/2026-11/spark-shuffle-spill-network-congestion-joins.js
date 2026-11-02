window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Spills & Network Congestion",
    "slug": "spark-shuffle-spill-network-congestion-joins",
    "language": "Java",
    "code": "FetchFailedException",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark batch and streaming pipelines, wide transformations (such as SortMergeJoin or GroupBy) require shuffling partition data across cluster nodes via Netty. When a data skew occurs\u2014where a small subset of join keys holds a massive proportion of rows\u2014target partition sizes rapidly exceed executor memory boundaries allocated by <code>spark.memory.fraction</code>.</p><p>As a result, Spark resorts to spilling internal memory data structures (ExternalAppendOnlyMap or PartitionedAppendOnlyMap) to disk. This causes severe I/O bottlenecks and saturates Netty transport threads with multi-gigabyte block requests, resulting in connection timeouts, <code>FetchFailedException</code>, and cascading <code>ExecutorLostFailure</code> alerts.</p>",
    "root_cause": "Key skew forcing disproportionate shuffle partition sizes, exceeding off-heap/execution memory and exhausting executor Netty chunk transfer limits.",
    "bad_code": "// Unmitigated wide join vulnerable to skew and shuffle spill\nDataset<Row> customers = spark.read().table(\"customers\");\nDataset<Row> orders = spark.read().table(\"orders\"); // Skewed on customer_id = 'DEFAULT_USER'\n\n// Triggers full SortMergeJoin across default 200 partitions with massive spills\nDataset<Row> joined = orders.join(\n    customers,\n    orders.col(\"customer_id\").equalTo(customers.col(\"id\")),\n    \"inner\"\n);\njoined.write().mode(SaveMode.Overwrite).parquet(\"/data/output/customer_orders\");",
    "solution_desc": "Enable Adaptive Query Execution (AQE) with automatic skew handling. For predictable join skews, apply salt-key transformations to distribute hot keys over multiple partitions, or broadcast the smaller lookup dataset to eliminate the shuffle phase entirely.",
    "good_code": "import org.apache.spark.sql.functions;\nimport static org.apache.spark.sql.functions.*;\n\n// Configure AQE and skew mitigation dynamically\nspark.conf().set(\"spark.sql.adaptive.enabled\", \"true\");\nspark.conf().set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\");\nspark.conf().set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\");\nspark.conf().set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"134217728\");\n\nDataset<Row> customers = spark.read().table(\"customers\");\nDataset<Row> orders = spark.read().table(\"orders\");\n\n// Method A: Broadcast smaller table if under threshold to remove shuffle\nDataset<Row> joined = orders.join(\n    functions.broadcast(customers),\n    orders.col(\"customer_id\").equalTo(customers.col(\"id\")),\n    \"inner\"\n);\n\n// Method B: Manual key salting for persistent heavy-skew tables\nint saltBins = 8;\nDataset<Row> saltedOrders = orders.withColumn(\"salt\", floor(rand().multiply(saltBins)));\nDataset<Row> saltedCust = customers\n    .withColumn(\"salt_arr\", array(lit(0), lit(1), lit(2), lit(3), lit(4), lit(5), lit(6), lit(7)))\n    .withColumn(\"salt\", explode(col(\"salt_arr\")))\n    .drop(\"salt_arr\");\n\nDataset<Row> saltJoined = saltedOrders.join(\n    saltedCust,\n    saltedOrders.col(\"customer_id\").equalTo(saltedCust.col(\"id\"))\n        .and(saltedOrders.col(\"salt\").equalTo(saltedCust.col(\"salt\")))\n).drop(\"salt\");\n\nsaltJoined.write().mode(SaveMode.Overwrite).parquet(\"/data/output/customer_orders\");",
    "verification": "Check the Spark UI 'Stages' tab: verify 'Shuffle Spill (Memory)' and 'Shuffle Spill (Disk)' are near zero. Confirm no 'Resubmitting task due to FetchFailed' messages appear in driver logs.",
    "date": "2026-11-02",
    "id": 1793629219,
    "type": "error"
});