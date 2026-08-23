window.onPostDataLoaded({
    "title": "Resolve Apache Spark Skewed Shuffle Spills & OOMs",
    "slug": "resolve-spark-skewed-shuffle-spill-executor-oom",
    "language": "Apache Spark / Scala",
    "code": "ExecutorLostFailure / OOM",
    "tags": [
        "Java",
        "SQL",
        "Spark",
        "DistributedSystems",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Data skew is one of the most critical performance bottlenecks in distributed data processing engines like Apache Spark. When executing wide transformations such as <code>join</code>, <code>groupByKey</code>, or <code>repartition</code>, Spark computes a hash of the partition key to assign rows to shuffle partitions.</p><p>When a subset of keys (e.g., null values, default user IDs, or high-volume enterprise accounts) accounts for a disproportionate percentage of the total dataset, the executor tasks handling those specific keys receive tens of gigabytes of data while sibling tasks process mere megabytes. The skewed partition exceeds the allocated executor execution/storage memory fractions, forcing Spark to spill data repeatedly to disk. When the uncompressed shuffle spill overwhelms JVM heap memory limits during aggregation object serialization, the task crashes with <code>java.lang.OutOfMemoryError: Java heap space</code> and triggers cascading <code>ExecutorLostFailure</code>.</p>",
    "root_cause": "Severe key distribution skew causing individual shuffle partition tasks to exceed executor memory allocations, inducing excessive on-disk shuffle spills and unrecoverable JVM heap exhaustion.",
    "bad_code": "import org.apache.spark.sql.functions._\nimport org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder().appName(\"SkewedJoin\").getOrCreate()\n\nval clickEvents = spark.read.parquet(\"s3://warehouse/events\") // Millions of rows with user_id = null\nval users = spark.read.parquet(\"s3://warehouse/users\")\n\n// Bug: Standard join without skew mitigation triggers massive shuffle spill & executor OOM\nval joinedDf = clickEvents.join(users, clickEvents(\"user_id\") === users(\"id\"), \"inner\")\njoinedDf.write.mode(\"overwrite\").parquet(\"s3://warehouse/output\")",
    "solution_desc": "Enable Adaptive Query Execution (AQE) skew join handling in Spark 3.x+ and apply key salting on the skewed join keys to split dominant partitions across multiple parallel executor tasks.",
    "good_code": "import org.apache.spark.sql.functions._\nimport org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder()\n  .appName(\"ResilientSaltedJoin\")\n  // Enable Adaptive Query Execution for dynamic skew handling\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"3\")\n  .config(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"64MB\")\n  .getOrCreate()\n\nval clickEvents = spark.read.parquet(\"s3://warehouse/events\")\nval users = spark.read.parquet(\"s3://warehouse/users\")\n\n// Manual Key Salting for extreme skew resilience\nval saltFactor = 16\nval saltedEvents = clickEvents.withColumn(\n  \"salted_key\",\n  when(col(\"user_id\").isNull || col(\"user_id\") === \"DEFAULT\",\n       concat(coalesce(col(\"user_id\"), lit(\"NULL\")), lit(\"_\"), floor(rand() * saltFactor)))\n    .otherwise(col(\"user_id\"))\n)\n\nval explodedUsers = users.withColumn(\n  \"salt_array\",\n  when(col(\"id\").isNull || col(\"id\") === \"DEFAULT\", array((0 until saltFactor).map(lit): _*))\n    .otherwise(array(lit(0)))\n).withColumn(\"salt\", explode(col(\"salt_array\")))\n.withColumn(\n  \"salted_key\",\n  when(col(\"id\").isNull || col(\"id\") === \"DEFAULT\",\n       concat(coalesce(col(\"id\"), lit(\"NULL\")), lit(\"_\"), col(\"salt\")))\n    .otherwise(col(\"id\"))\n)\n\nval joinedDf = saltedEvents.join(explodedUsers, \"salted_key\")\n  .drop(\"salted_key\", \"salt_array\", \"salt\")\n\njoinedDf.write.mode(\"overwrite\").parquet(\"s3://warehouse/output\")",
    "verification": "Inspect the Spark UI SQL and Stages tabs to verify that task execution times are uniformly distributed, 'Shuffle Spill (Memory)' and 'Shuffle Spill (Disk)' metrics approach zero, and AQE confirms 'AdaptiveSparkPlan isFinal=true'.",
    "date": "2026-08-23",
    "id": 1787476728,
    "type": "error"
});