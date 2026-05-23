window.onPostDataLoaded({
    "title": "Fixing Spark Driver OOM on Skewed Partition Broadcast Joins",
    "slug": "spark-driver-oom-skewed-partition-broadcast-joins",
    "language": "Scala",
    "code": "OutOfMemoryError: Java heap space",
    "tags": [
        "Java",
        "Scala",
        "Spark",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, a Broadcast Hash Join (BHJ) is used to optimize joins by broadcasting a small DataFrame to all executors, bypassing the shuffle phase. To achieve this, the Spark Driver collects the entire partitions of the table to be broadcasted into its local JVM memory, serializes them, and distributes them. However, when the broadcasted relation contains severely skewed partitions, the data footprint can inflate dramatically.</p><p>If the physical plan estimates the broadcast table size to be under the `spark.sql.autoBroadcastJoinThreshold` threshold, but the actual dynamic runtime size of a single partition is extremely large, the Driver's heap gets exhausted during the `collect` phase, resulting in `java.lang.OutOfMemoryError: Java heap space`. This occurs because Spark's estimation does not account for skew or in-memory decompressed object footprints.</p>",
    "root_cause": "The Spark Driver attempts to collect and serialize skewed partitions from executors into its local JVM memory, exceeding the allocated `spark.driver.memory` footprint.",
    "bad_code": "import org.apache.spark.sql.functions.broadcast\nimport org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder().appName(\"SkewedJoinExample\").getOrCreate()\n\nval largeSkewedDF = spark.read.parquet(\"hdfs:///data/large_transactions\")\nval smallLookupDF = spark.read.parquet(\"hdfs:///data/store_details\") \n\n// CRASH: Forcing a broadcast on lookup data that is skewed \n// and contains unexpected massive partitions on individual driver nodes\nval joinedDF = largeSkewedDF.join(broadcast(smallLookupDF), \"store_id\")\njoinedDF.write.mode(\"overwrite\").parquet(\"hdfs:///output/joined_data\")",
    "solution_desc": "Disable forced broadcasts on datasets with large/skewed dynamic footprints. Instead, handle the join by implementing a salted key mechanism to distribute skewed keys evenly, and let Adaptive Query Execution (AQE) automatically handle the skew at runtime by adjusting `spark.sql.adaptive.skewJoin.enabled`.",
    "good_code": "import org.apache.spark.sql.functions.{broadcast, col, concat, lit, rand}\nimport org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder()\n  .appName(\"SaltedJoinSolution\")\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  .getOrCreate()\n\nval largeSkewedDF = spark.read.parquet(\"hdfs:///data/large_transactions\")\nval smallLookupDF = spark.read.parquet(\"hdfs:///data/store_details\")\n\n// Apply salting to distribute skewed keys across multiple partitions\nval saltRange = 10\nval saltedLargeDF = largeSkewedDF.withColumn(\"salt_key\", concat(col(\"store_id\"), lit(\"_\"), (rand() * saltRange).cast(\"int\")))\n\n// Replicate the lookup table to match the salt space\nval replicatedLookupDF = smallLookupDF.flatMap(row => {\n  val storeId = row.getAs[String](\"store_id\")\n  (0 until saltRange).map(salt => {\n    (s\"${storeId}_$salt\", storeId, row.getAs[String](\"store_name\"))\n  })\n}).toDF(\"salt_key\", \"original_store_id\", \"store_name\")\n\n// Join on salted key safely, avoiding single-partition Driver collect OOM\nval joinedDF = saltedLargeDF.join(replicatedLookupDF, \"salt_key\")\n  .drop(\"salt_key\", \"original_store_id\")\n\njoinedDF.write.mode(\"overwrite\").parquet(\"hdfs:///output/joined_data\")",
    "verification": "Submit the Spark job and check the Spark UI. Verify under the 'SQL' tab that the physical plan shows dynamic partition splitting during the join step. Ensure no Executor or Driver task fails with `OOM` and that driver memory consumption remains stable.",
    "date": "2026-05-23",
    "id": 1779531747,
    "type": "error"
});