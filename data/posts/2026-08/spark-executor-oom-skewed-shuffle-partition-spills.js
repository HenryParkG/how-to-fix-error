window.onPostDataLoaded({
    "title": "Fixing Spark Executor OOM From Skewed Shuffle Spills",
    "slug": "spark-executor-oom-skewed-shuffle-partition-spills",
    "language": "Java",
    "code": "Spark Executor OOM",
    "tags": [
        "Java",
        "Kubernetes",
        "Apache Spark",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark applications frequently encounter OutOfMemory (OOM) errors (e.g., <code>java.lang.OutOfMemoryError: Java heap space</code> or Executor Container Exit Code 137) during wide transformation steps like joins or aggregations.</p><p>When processing datasets with skewed key distributions, Spark routes all records belonging to the same hash key to a single partition on a single executor task. As data volume for that key spikes, the memory allocated for task execution (`spark.memory.fraction`) fills rapidly. Spark attempts to spill buffered records to disk; however, in-memory aggregation buffers (like `AppendOnlyMap` or `UnsafeInMemorySorter`) require proportional object overhead during deserialization and sorting. When a single partition vastly exceeds executor memory limits, garbage collection overhead spikes, object allocation fails, and the executor dies.</p>",
    "root_cause": "Data skew concentrates excessive data onto a single shuffle partition, exceeding executor task execution memory limits during in-memory buffer sorting and spilling operations.",
    "bad_code": "// Scala Spark Code exhibiting partition skew OOM\nimport org.apache.spark.sql.functions._\n\nval userEvents = spark.read.parquet(\"s3a://data/events\")\nval userProfiles = spark.read.parquet(\"s3a://data/profiles\")\n\n// BUG: Joining on highly skewed key ('null' or heavy default IDs) without salting or AQE skew join\nval joinedDF = userEvents.join(\n  userProfiles,\n  userEvents(\"user_id\") === userProfiles(\"user_id\"),\n  \"inner\"\n)\n\njoinedDF.groupBy(\"user_id\").count().write.parquet(\"s3a://data/output\")",
    "solution_desc": "Mitigate skew OOM traps by enabling Adaptive Query Execution (AQE) skew join handling in Spark 3.x. For manual skew management or complex aggregations, implement 'salting'\u2014appending a random integer to the join key to split heavily skewed keys across multiple execution partitions before aggregating.",
    "good_code": "// Solution 1: Enable AQE Skew Join Handling dynamically\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"5\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"256MB\")\n\n// Solution 2: Manual Key Salting Pattern\nimport org.apache.spark.sql.functions._\n\nval saltBins = 8\nval saltedEvents = userEvents.withColumn(\n  \"salted_id\",\n  concat(col(\"user_id\"), lit(\"_\"), floor(rand() * saltBins))\n)\n\nval saltedProfiles = userProfiles.withColumn(\n  \"salt_array\",\n  array((0 until saltBins).map(lit): _*)\n).select(col(\"*\"), explode(col(\"salt_array\")).as(\"salt\"))\n .withColumn(\"salted_id\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt\")))\n\nval joinResult = saltedEvents.join(\n  saltedProfiles,\n  \"salted_id\"\n).drop(\"salted_id\", \"salt\", \"salt_array\")",
    "verification": "Inspect the Spark UI 'Stages' tab for the bottleneck stage. Verify that 'Min/Median/Max' task duration and shuffle read metrics are balanced across all tasks, and confirm that zero executors experience GC pauses above 10 seconds or Exit Code 137 container terminations.",
    "date": "2026-08-07",
    "id": 1786068519,
    "type": "error"
});