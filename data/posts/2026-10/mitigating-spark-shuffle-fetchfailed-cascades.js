window.onPostDataLoaded({
    "title": "Mitigating Spark Shuffle FetchFailed Cascades",
    "slug": "mitigating-spark-shuffle-fetchfailed-cascades",
    "language": "Java",
    "code": "FetchFailedException",
    "tags": [
        "Java",
        "Backend",
        "Kubernetes",
        "AWS",
        "Spark",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark batch and streaming pipelines frequently collapse during heavy shuffle operations with <code>org.apache.spark.shuffle.FetchFailedException: Failed to connect to /executor_ip:port</code>. When a single reducer task fails to fetch a shuffle block from an upstream map task, Spark marks the host executor as dead or the shuffle file as unreadable. In response, the DAGScheduler invalidates the entire upstream shuffle stage and triggers a recursive recomputation loop that quickly exhausts retry budgets and kills the job.</p><p>The root cause is a synchronization cascade caused by partition data skew. When a few keys contain millions of rows while others contain only hundreds, skew tasks monopolize JVM off-heap memory and trigger sustained Full GC pauses exceeding the default RPC heartbeat interval. When the external shuffle service or Netty transport server on that executor fails to respond within <code>spark.core.connection.ack.wait.timeout</code>, the fetching executor assumes node death. Spark's Dynamic Allocation then aggressively terminates the apparently unresponsive executor, destroying shuffle files on local disk and forcing stage resubmission.</p>",
    "root_cause": "Severe key skew causes long JVM Stop-The-World GC pauses and Netty connection timeouts on block fetch requests, leading the DAGScheduler to prematurely declare upstream executors dead and trigger stage resubmission storms.",
    "bad_code": "// Naive aggregation over skewed foreign keys without salting or adaptive execution\nDataset<Row> sales = spark.read().parquet(\"s3://bucket/sales\");\nDataset<Row> users = spark.read().parquet(\"s3://bucket/users\");\n\n// Joining on skewed 'merchant_id' (e.g., 90% of rows have merchant_id = 'DEFAULT_STORE')\nDataset<Row> joined = sales.join(\n    users,\n    sales.col(\"merchant_id\").equalTo(users.col(\"id\")),\n    \"inner\"\n);\n\njoined.groupBy(\"merchant_id\").count().write().mode(\"overwrite\").parquet(\"s3://bucket/out\");",
    "solution_desc": "Enable Spark Adaptive Query Execution (AQE) to coalesce and split skewed shuffle partitions dynamically, increase Netty RPC timeout limits, and isolate shuffle blocks with the Spark External Shuffle Service or Push-Based Shuffle.",
    "good_code": "// Enable AQE dynamic skew handling and tune transport timeouts\nSparkSession spark = SparkSession.builder()\n    .appName(\"ResilientShuffleJoin\")\n    .config(\"spark.sql.adaptive.enabled\", \"true\")\n    .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n    .config(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\")\n    .config(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"64MB\")\n    .config(\"spark.core.connection.ack.wait.timeout\", \"120s\")\n    .config(\"spark.network.timeout\", \"300s\")\n    .config(\"spark.shuffle.io.maxRetries\", \"10\")\n    .config(\"spark.shuffle.io.retryWait\", \"15s\")\n    .getOrCreate();\n\n// Salt high-cardinality skew keys if AQE alone cannot smooth out the balance\nColumn saltedMerchantId = when(sales.col(\"merchant_id\").equalTo(\"DEFAULT_STORE\"),\n    concat(sales.col(\"merchant_id\"), lit(\"_\"), pmod(rand(), lit(10))))\n    .otherwise(sales.col(\"merchant_id\"));",
    "verification": "Inspect the Spark UI Stages tab. Confirm that tasks within the shuffle read stage show roughly equal runtime distribution, verify no `FetchFailed` task retry events appear, and check executor logs to ensure RPC heartbeat timeouts are eliminated.",
    "date": "2026-10-16",
    "id": 1792136504,
    "type": "error"
});