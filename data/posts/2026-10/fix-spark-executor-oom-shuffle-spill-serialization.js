window.onPostDataLoaded({
    "title": "Fix Spark Executor OOM from Shuffle Spill Serialization",
    "slug": "fix-spark-executor-oom-shuffle-spill-serialization",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Kubernetes",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When executing large-scale distributed joins or aggregations in Apache Spark, uneven key distributions (data skew) frequently trigger fatal <code>java.lang.OutOfMemoryError: Java heap space</code> crashes on worker executors. While Spark is designed to spill unrolled in-memory partitions from the <code>ExternalAppendOnlyMap</code> or <code>PartitionedAppendOnlyMap</code> to disk once execution memory thresholds are breached, this spill path is itself prone to heap exhaustion.</p><p>During a disk spill, Spark uses an internal object serializer buffer to convert in-memory JVM object references into binary pages. If skewed keys produce massive individual object graphs or deep collections, the serialization buffer attempts to resize dynamically. When remaining executor memory headroom is insufficient to allocate contiguous backing arrays for the serializer, the JVM throws an OOM error before the disk write can complete.</p>",
    "root_cause": "Partition key skew creates oversized object clusters within execution memory, triggering unbounded buffer expansions during Spark's disk-spill serialization phase that overwhelm the JVM heap.",
    "bad_code": "// Skewed join causing single-executor memory overload\nval ordersDF = spark.read.table(\"orders\")\nval customersDF = spark.read.table(\"customers\")\n\n// Default settings without Adaptive Query Execution or skew handling\nval enriched = ordersDF.join(\n  customersDF,\n  ordersDF(\"seller_id\") === customersDF(\"id\"),\n  \"inner\"\n).groupBy(\"seller_id\").count()\n\nenriched.write.mode(\"overwrite\").parquet(\"s3://warehouse/output\")\n",
    "solution_desc": "Resolve the failure by enabling Adaptive Query Execution (AQE) with automatic skew join splitting, transitioning from Java's default serialization to the optimized Kryo serializer, and salting high-cardinality skewed keys to distribute memory pressure across multiple partitions before shuffle spilling occurs.",
    "good_code": "// Enable AQE Skew Join & Kryo in Spark Session Configuration\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"3\")\nspark.conf.set(\"spark.serializer\", \"org.apache.spark.serializer.KryoSerializer\")\n\n// Salting technique for explicit skew mitigation\nimport org.apache.spark.sql.functions._\n\nval SALT_ROUNDS = 16\nval saltedOrders = ordersDF.withColumn(\"salt\", (rand() * SALT_ROUNDS).cast(\"int\"))\n  .withColumn(\"salted_seller_id\", concat(col(\"seller_id\"), lit(\"_\"), col(\"salt\")))\n\nval saltedCustomers = customersDF.withColumn(\"salt_array\", array((0 until SALT_ROUNDS).map(lit): _*))\n  .withColumn(\"salt\", explode(col(\"salt_array\")))\n  .withColumn(\"salted_seller_id\", concat(col(\"id\"), lit(\"_\"), col(\"salt\")))\n\nval result = saltedOrders.join(saltedCustomers, \"salted_seller_id\")\n",
    "verification": "Inspect the Spark UI 'Stages' tab to confirm that 'Spill (Memory)' and 'Spill (Disk)' metrics are distributed uniformly across tasks. Verify that no single executor task handles significantly higher record counts or exhibits long JVM GC pauses.",
    "date": "2026-10-22",
    "id": 1792636423,
    "type": "error"
});