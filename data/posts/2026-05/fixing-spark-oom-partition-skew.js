window.onPostDataLoaded({
    "title": "Fixing Spark OOM from Partition Skew in Shuffled Joins",
    "slug": "fixing-spark-oom-partition-skew",
    "language": "Apache Spark",
    "code": "OutOfMemoryError",
    "tags": [
        "Spark",
        "Java",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, shuffled joins redistribute data across the cluster based on the hash of the join keys. When a high percentage of rows share the exact same join key (such as null values, empty strings, or high-frequency default values), Spark routes all those records to a single partition. This creates partition skew. The executor assigned to process this skewed partition runs out of JVM heap memory, causing a fatal <code>java.lang.OutOfMemoryError: GC overhead limit exceeded</code> or container preemption by the YARN/Kubernetes manager.</p>",
    "root_cause": "A highly skewed distribution of join keys forces an extremely unbalanced volume of data into a single shuffle partition, exhausting the allocated JVM heap space of the processing executor.",
    "bad_code": "import org.apache.spark.sql.functions._\n\n// Bad Practice: Standard join on un-salted, highly skewed dataset\nval dfLarge = spark.read.parquet(\"s3://bucket/large_table\") // contains Millions of nulls in 'customer_id'\nval dfDim = spark.read.parquet(\"s3://bucket/customer_dimension\")\n\nval joinedDF = dfLarge.join(dfDim, \"customer_id\")\njoinedDF.write.parquet(\"s3://bucket/output/\")",
    "solution_desc": "Enable Adaptive Query Execution (AQE) skew join optimization, which detects skew automatically and splits skewed partitions into smaller sub-partitions. Alternatively, implement manual key salting: append a random integer to the join keys on the skewed dataframe to distribute the data evenly, and duplicate the corresponding rows in the dimension table to match the salted keys.",
    "good_code": "// 1. Enable Spark Adaptive Query Execution (AQE) with Skew Join optimization\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"268435456\") // 256MB\n\n// 2. Fallback / Explicit Manual Salting Approach for extremely skewed keys\nimport org.apache.spark.sql.functions._\n\nval saltRange = 10\nval dfLargeSalted = dfLarge.withColumn(\"salted_key\", \n  when(col(\"customer_id\").isNull, concat(lit(\"null_\"), rand() * saltRange cast \"int\"))\n    .otherwise(col(\"customer_id\"))\n)\n\nval dfDimExploded = dfDim.withColumn(\"salt_array\", array((0 until saltRange).map(lit): _*))\n  .withColumn(\"exploded_salt\", explode(col(\"salt_array\")))\n  .withColumn(\"salted_key\", \n    when(col(\"customer_id\").isNull, concat(lit(\"null_\"), col(\"exploded_salt\")))\n      .otherwise(col(\"customer_id\"))\n  )\n\nval balancedJoin = dfLargeSalted.join(dfDimExploded, \"salted_key\")",
    "verification": "Execute the Spark application and monitor the Spark Web UI under the 'SQL' or 'Jobs' tab. Check the task execution time distribution for the Shuffle Stage; ensure that the max task execution time is close to the median task execution time, demonstrating balanced partition sizes.",
    "date": "2026-05-29",
    "id": 1780020825,
    "type": "error"
});