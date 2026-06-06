window.onPostDataLoaded({
    "title": "Fixing Spark Executor OOM from Partition Skew",
    "slug": "fixing-spark-executor-oom-partition-skew",
    "language": "Scala",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Scala",
        "Spark",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, data is distributed across multiple partitions and processed concurrently by executors. When a join or group-by key is unevenly distributed, a phenomenon known as <strong>partition skew</strong> occurs. This forces a single executor to process a vastly disproportionate amount of data compared to its peers.</p><p>As the skewed partition swells, it exceeds the designated JVM heap space. This triggers heavy JVM Garbage Collection (GC) cycles, specifically within the G1GC garbage collector, causing the JVM to spend more than 98% of its time doing GC with less than 2% of the heap reclaimed (GC overhead limit exceeded), ultimately leading to executor JVM crash and the dreaded <code>Container killed by YARN/K8s for exceeding memory limits</code> error.</p>",
    "root_cause": "Data skewing on a specific join or group-by key causes a single Spark partition to grow beyond the executor's memory limits, triggering aggressive JVM Garbage Collection and GC overhead limit errors.",
    "bad_code": "import org.apache.spark.sql.functions._\n\n// Performing a join on an un-salted, highly skewed column ('tenant_id')\nval dfLarge = spark.read.parquet(\"s3a://bucket/large_events\")\nval dfLookup = spark.read.parquet(\"s3a://bucket/tenants\")\n\nval joinedDf = dfLarge.join(dfLookup, \"tenant_id\")\njoinedDf.write.parquet(\"s3a://bucket/output\")",
    "solution_desc": "Apply key salting to uniformly distribute the skewed key across multiple partitions, preventing any single partition from overloading an executor. Additionally, enable Spark's Adaptive Query Execution (AQE) skew join optimization to handle residual skews automatically.",
    "good_code": "import org.apache.spark.sql.functions._\n\n// Enable Adaptive Query Execution for dynamic skew handling\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n\n// Salt the skewed key in the large dataset\nval saltFactor = 10\nval saltedLarge = dfLarge.withColumn(\"salt\", floor(rand() * saltFactor))\n  .withColumn(\"salted_key\", concat(col(\"tenant_id\"), lit(\"_\"), col(\"salt\")))\n\n// Replicate lookup dataset rows to match salted keys\nval saltedLookup = dfLookup\n  .withColumn(\"salt_array\", array((0 until saltFactor).map(lit): _*))\n  .withColumn(\"salt\", explode(col(\"salt_array\")))\n  .withColumn(\"salted_key\", concat(col(\"tenant_id\"), lit(\"_\"), col(\"salt\")))\n\nval joinedDf = saltedLarge.join(saltedLookup, \"salted_key\")\n  .drop(\"salted_key\", \"salt\", \"salt_array\")\n\njoinedDf.write.parquet(\"s3a://bucket/output\")",
    "verification": "Monitor the Spark History Server UI under the 'Stages' tab. Verify that the task execution time distribution is uniform, and ensure the ratio between maximum task runtime and median task runtime is close to 1.0. Check GC metrics to ensure GC pause times remain below 5% of total task runtime.",
    "date": "2026-06-06",
    "id": 1780726917,
    "type": "error"
});