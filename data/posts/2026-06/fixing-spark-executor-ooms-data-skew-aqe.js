window.onPostDataLoaded({
    "title": "Fixing Spark Executor OOMs from Data Skew in AQE",
    "slug": "fixing-spark-executor-ooms-data-skew-aqe",
    "language": "Scala, Spark",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Python",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark Adaptive Query Execution (AQE) dynamic optimizations are highly efficient but can fail with Executor OutOfMemory (OOM) errors when processing skewed datasets. Data skew occurs when certain keys have a significantly higher frequency than others, causing some shuffle partitions to become disproportionately larger.</p><p>Although AQE includes a feature to automatically detect and split skewed partitions during join operations, this optimization is bypassed if configured parameters do not align with the actual size distribution of your dataset. As a result, skewed partitions get assigned to individual executor JVMs, exhausting heap memory and triggering a garbage collection overhead crash.</p>",
    "root_cause": "The default AQE configuration values for identifying skewed partitions are too restrictive for medium-to-large-scale datasets. Specifically, if a skewed partition is not at least 5 times larger than the median partition size (`spark.sql.adaptive.skewJoin.skewedPartitionFactor`), or if it is smaller than 256MB (`spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes`), AQE fails to split it. Consequently, huge data blocks shuffle into a single reducer partition, exhausting the executor's JVM heap memory.",
    "bad_code": "import org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder()\n  .appName(\"SkewedJoins\")\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  // Outdated/missing parameters cause AQE to miss key-skews\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  .getOrCreate()",
    "solution_desc": "Fine-tune AQE skew parameters to make partition splitting much more aggressive. Decrease `spark.sql.adaptive.skewJoin.skewedPartitionFactor` and lower `spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes` to ensure even minor skews are captured and partitioned. This forces Spark to split large, skewed tasks into smaller sub-tasks, balancing the workload dynamically across executors.",
    "good_code": "import org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder()\n  .appName(\"OptimizedSkewedJoins\")\n  .config(\"spark.sql.adaptive.enabled\", \"true\")\n  .config(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n  // Make skew detection aggressive: target partitions > 128MB or 2x median size\n  .config(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"2\")\n  .config(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"134217728\")\n  .config(\"spark.sql.shuffle.partitions\", \"1000\")\n  .getOrCreate()",
    "verification": "Run your Spark application and monitor the execution graph in the Spark UI's 'SQL' tab. Expand the 'SortMergeJoin' stage and confirm that 'skewed partition split' markers appear on the task timeline. Verify that executor memory metrics in Prometheus or Grafana remain stable and uniform throughout the shuffle phase.",
    "date": "2026-06-03",
    "id": 1780474069,
    "type": "error"
});