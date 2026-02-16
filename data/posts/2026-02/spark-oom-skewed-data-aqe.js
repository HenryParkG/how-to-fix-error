window.onPostDataLoaded({
    "title": "Fixing Spark Executor OOMs in Skewed AQE Joins",
    "slug": "spark-oom-skewed-data-aqe",
    "language": "Scala",
    "code": "java.lang.OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Adaptive Query Execution (AQE) is designed to handle data skew dynamically by splitting large partitions. However, in high-throughput pipelines, skewed keys can still cause specific executors to exceed their heap limits during the Shuffle Exchange phase. This typically happens when the skew exceeds the default <code>spark.sql.adaptive.skewJoin.skewedPartitionFactor</code>, or when the 'split' partitions are still too large to fit in the execution memory fraction, leading to a 'Fetch Failed' error or a hard JVM OOM.</p>",
    "root_cause": "Data skew where a single key's volume exceeds the available executor memory per core, coupled with AQE thresholds that are too conservative to trigger partition splitting.",
    "bad_code": "val df = spark.read.parquet(\"huge_data.parquet\")\n// Default config often fails on 10x skew\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\ndf.join(otherDf, \"skewed_id\").write.save(\"output\")",
    "solution_desc": "Explicitly lower the skew join thresholds to make AQE more aggressive and increase the min/max partition sizes. Also, ensure 'spark.sql.adaptive.advisoryPartitionSizeInBytes' is tuned relative to executor memory.",
    "good_code": "// Tuning AQE for aggressive skew handling\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionFactor\", \"2\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes\", \"128MB\")\nspark.conf.set(\"spark.sql.adaptive.advisoryPartitionSizeInBytes\", \"64MB\")",
    "verification": "Monitor the Spark UI 'SQL' tab to ensure 'skew join' nodes appear in the physical plan and check that 'Peak Execution Memory' per task is stabilized.",
    "date": "2026-02-16",
    "id": 1771204675,
    "type": "error"
});