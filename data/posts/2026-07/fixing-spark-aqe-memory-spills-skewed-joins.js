window.onPostDataLoaded({
    "title": "Fixing Spark AQE Memory Spills in Skewed Data Joins",
    "slug": "fixing-spark-aqe-memory-spills-skewed-joins",
    "language": "Scala / Apache Spark",
    "code": "OutOfMemoryError",
    "tags": [
        "Apache Spark",
        "AQE",
        "Big Data",
        "Java",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Adaptive Query Execution (AQE) in Apache Spark dynamically optimizes join plans at runtime. However, during large-scale join operations with high key cardinality skew, Spark's AQE skew join handling can dynamically split skewed partitions into sub-partitions that still exceed executor off-heap/on-heap memory limits. This leads to massive disk spills, extreme GC pauses, and eventually <code>java.lang.OutOfMemoryError: Java heap space</code> or executor container termination by YARN/Kubernetes resource managers.</p>",
    "root_cause": "The default AQE advisory partition size (`spark.sql.adaptive.advisoryPartitionSizeInBytes`) combined with insufficient skew threshold factors causes AQE to miscalculate partition split granularity for non-uniform data distributions, forcing single tasks to process skewed keys exceeding memory thresholds.",
    "bad_code": "// Misconfigured Spark Context failing under severe key skew\nval spark = SparkSession.builder()\n  .appName(\"SkewedJoinFix\")\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  // Default settings allow partition sizes up to 64MB without splitting small skew\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  .getOrCreate()\n\nval df1 = spark.table(\"large_fact_table\")\nval df2 = spark.table(\"dimension_table\")\n\n// Unsalted join on high-skew column 'user_id'\nval result = df1.join(df2, \"user_id\")\nresult.write.mode(\"overwrite\").parquet(\"/output/data\")",
    "solution_desc": "Fix the memory spills by tuning AQE skew parameters to aggressively split skewed partitions, increasing executor memory overhead, and implementing dynamic salting on skewed join key columns.",
    "good_code": "import org.apache.spark.sql.functions._\n\nval spark = SparkSession.builder()\n  .appName(\"SkewedJoinFix\")\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  // Force dynamic split on smaller skew thresholds\n  .config(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"2\")\n  .config(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"32MB\")\n  .config(\"spark.sql.adaptive.advisoryPartitionSizeInBytes\", \"16MB\")\n  .getOrCreate()\n\n// Apply key salting to uniformly distribute hot join keys\nval saltBins = 4\nval df1Salted = df1.withColumn(\"salt\", concat(col(\"user_id\"), lit(\"_\"), floor(rand() * saltBins)))\nval df2Salted = df2.withColumn(\"salt_array\", explode(array((0 until saltBins).map(lit): _*)))\n                   .withColumn(\"salt\", concat(col(\"user_id\"), lit(\"_\"), col(\"salt_array\")))\n\nval result = df1Salted.join(df2Salted, \"salt\")\nresult.write.mode(\"overwrite\").parquet(\"/output/data\")",
    "verification": "Inspect Spark UI execution DAG under 'SQL' tab. Verify that dynamic skew join nodes ('SortMergeJoin' with 'AQESkewedJoinExec') show balanced read bytes per partition without memory spill spikes under executor metrics.",
    "date": "2026-07-25",
    "id": 1784944176,
    "type": "error"
});