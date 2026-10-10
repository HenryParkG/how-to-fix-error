window.onPostDataLoaded({
    "title": "Fix Spark Shuffle FetchFailed & Heartbeat Loss",
    "slug": "fix-spark-shuffle-fetchfailed-heartbeat-starvation",
    "language": "Java / Spark",
    "code": "FetchFailedException",
    "tags": [
        "Apache Spark",
        "Big Data",
        "Java",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In heavy Apache Spark workloads, jobs frequently crash with <code>org.apache.spark.shuffle.FetchFailedException: Failed to connect to /... [Executor is lost]</code> accompanied by <code>ExecutorHeartbeatTimedOutException</code>. This cascade starts when massive data skew or undersized shuffle partitions force executor JVMs into prolonged Stop-The-World (STW) Garbage Collection pauses.</p><p>During lengthy GC pauses, the Netty transport server becomes unresponsive, failing to handle remote block transfers from downstream reducers. Simultaneously, the internal <code>Heartbeater</code> thread fails to send scheduled heartbeats to the driver within <code>spark.network.timeout</code> (default 120s). The driver presumes the executor is dead, deregisters it, and triggers stage retries. Downstream fetch requests subsequently fail permanently, ultimately causing the entire application to terminate after exhausting retry limits.</p>",
    "root_cause": "Severe JVM garbage collection pauses caused by shuffle data skew choke Netty block transfers and starve executor heartbeat threads, causing driver timeout eviction and downstream shuffle fetch failures.",
    "bad_code": "// Bad Spark Job Configuration and Execution Pattern\nval spark = SparkSession.builder()\n  .appName(\"SkewedShuffleJob\")\n  // Defaults leave shuffle partitions at 200 regardless of data size\n  .config(\"spark.sql.shuffle.partitions\", \"200\")\n  .config(\"spark.executor.memory\", \"8g\")\n  // Insufficient GC and timeout settings\n  .config(\"spark.network.timeout\", \"120s\")\n  .config(\"spark.executor.heartbeatInterval\", \"10s\")\n  .getOrCreate()\n\n// Heavy join on highly skewed key without salting\nval orders = spark.table(\"orders\")\nval customers = spark.table(\"customers\")\nval result = orders.join(customers, \"customer_id\") // 'customer_id' has high cardinality skew\nresult.write.mode(\"overwrite\").parquet(\"/output/orders_enriched\")",
    "solution_desc": "Architecturally resolve the issue by: 1) Enabling Adaptive Query Execution (AQE) to coalesce and dynamically split skewed shuffle partitions, 2) Offloading shuffle hosting by enabling the External Shuffle Service or Push-based Shuffle, 3) Tuning the G1GC collector with explicit pause targets and initiator thresholds, and 4) Extending network heartbeat timeouts to withstand transient pressure.",
    "good_code": "val spark = SparkSession.builder()\n  .appName(\"ResilientShuffleJob\")\n  // Enable Adaptive Query Execution for skew remediation\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.coalescePartitions.enabled\", \"true\")\n  // Network timeout resilience\n  .config(\"spark.network.timeout\", \"800s\")\n  .config(\"spark.executor.heartbeatInterval\", \"60s\")\n  // G1GC tuning to suppress STW pauses\n  .config(\"spark.executor.extraJavaOptions\",\n    \"-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=45 \" +\n    \"-XX:G1ReservePercent=15 -XX:MaxGCPauseMillis=200 -XX:+ParallelRefProcEnabled\")\n  .config(\"spark.shuffle.service.enabled\", \"true\")\n  .getOrCreate()\n\nval orders = spark.table(\"orders\")\nval customers = spark.table(\"customers\")\n\n// Skew handled automatically by AQE or explicit salting\norders.join(customers.hint(\"skew\", \"customer_id\"), \"customer_id\")\n  .write.mode(\"overwrite\").parquet(\"/output/orders_enriched\")",
    "verification": "Check the Spark UI 'Executors' tab to ensure GC time accounts for less than 10% of total task time. Confirm zero `FetchFailedException` entries in the 'Stages' tab and verify that failed task attempts drop to zero under peak data skew.",
    "date": "2026-10-10",
    "id": 1791632239,
    "type": "error"
});