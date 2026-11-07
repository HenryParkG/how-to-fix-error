window.onPostDataLoaded({
    "title": "Resolving Spark FetchFailedException & Skew Partition OOM",
    "slug": "resolving-spark-fetchfailed-skew-partition-oom",
    "language": "Spark / Scala",
    "code": "FetchFailedException",
    "tags": [
        "Java",
        "SQL",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In distributed Apache Spark workflows, wide-dependency transformations like joins and aggregations trigger shuffle stages across executors via the Netty transport layer. When certain partition keys contain disproportionately high record volumes (data skew), individual reducers consume excessive JVM memory trying to build shuffle hash tables or append to internal append-only maps.</p><p>This leads to two common failure cascades: either the skewed executor hits an out-of-memory error causing the JVM to exit, or the node becomes unresponsive due to extended Stop-the-World garbage collection pauses. Upstream tasks subsequently fail with <code>FetchFailedException: Connection reset by peer</code> or <code>Timeout waiting for task</code>, triggering consecutive stage retries until the driver terminates the entire job after reaching <code>spark.stage.maxConsecutiveAttempts</code> limit.</p>",
    "root_cause": "Extreme partition data skew concentrates gigabytes of key-value pairs into a single reducer partition, exceeding executor heap allocation (leading to OS SIGKILL 137 or OutOfMemoryError) and surpassing the Netty shuffle block 2GB fetch limit.",
    "bad_code": "// Naive join on a heavily skewed foreign key\nval transactionsDF = spark.read.parquet(\"s3://warehouse/transactions\")\nval customersDF = spark.read.parquet(\"s3://warehouse/customers\")\n\n// Problematic: 'customer_id' has high cardinality skew (e.g., nulls or guest accounts)\nval joinedDF = transactionsDF\n  .join(customersDF, Seq(\"customer_id\"), \"inner\")\n  .groupBy(\"customer_id\")\n  .agg(sum(\"amount\").as(\"total_spend\"))\n\njoinedDF.write.mode(\"overwrite\").parquet(\"s3://output/customer_metrics\")",
    "solution_desc": "Mitigate skew-induced shuffle failures by enabling Spark Adaptive Query Execution (AQE) with automatic skew joining. For pre-AQE Spark versions or severe skew, apply key salting to uniformly distribute hot keys across randomized sub-buckets before executing the join.",
    "good_code": "import org.apache.spark.sql.functions._\n\n// 1. Enable AQE skew handling dynamically\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"134217728\") // 128MB\n\n// 2. Programmatic salting fallback for severe skew\nval saltRange = 16\nval saltedTx = transactionsDF.withColumn(\n  \"salt\",\n  when(col(\"customer_id\") === \"DEFAULT_GUEST\" || col(\"customer_id\").isNull,\n       floor(rand() * saltRange)).otherwise(lit(0))\n)\n\nval saltedCust = customersDF.withColumn(\n  \"salt_array\",\n  when(col(\"customer_id\") === \"DEFAULT_GUEST\" || col(\"customer_id\").isNull,\n       array((0 until saltRange).map(lit): _*)).otherwise(array(lit(0)))\n).withColumn(\"salt\", explode(col(\"salt_array\")))\n\nval balancedJoin = saltedTx.join(saltedCust, Seq(\"customer_id\", \"salt\"), \"inner\")\n  .groupBy(\"customer_id\")\n  .agg(sum(\"amount\").as(\"total_spend\"))",
    "verification": "Inspect the Spark Web UI under the Stages tab. Confirm that 'Shuffle Read Size' across tasks shows a uniform distribution rather than a long tail. Verify in SQL execution DAG that 'SortMergeJoin' has been optimized with 'AdaptiveSparkPlan' and skewed partition splitting annotations.",
    "date": "2026-11-07",
    "id": 1794023322,
    "type": "error"
});