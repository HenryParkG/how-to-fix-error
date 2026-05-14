window.onPostDataLoaded({
    "title": "Mitigating Spark Skewed Join Memory Pressure",
    "slug": "spark-skewed-join-memory-pressure",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Data skew is a common performance bottleneck in distributed processing where a few keys have significantly more records than others. During a Join operation in Apache Spark, all records for a specific key are shuffled to the same partition. If one key is highly frequent, that partition grows too large for the executor's memory, leading to frequent GCs or <code>java.lang.OutOfMemoryError: Java heap space</code>, even if the rest of the cluster is idle.</p>",
    "root_cause": "Uneven distribution of join keys causing a single shuffle partition to exceed the physical memory limits of a single Spark executor.",
    "bad_code": "// Standard join without skew handling\nDataset<Row> result = df1.join(df2, \"skewed_key\");",
    "solution_desc": "Enable Adaptive Query Execution (AQE) and use the SKEW hint. Spark will automatically detect the skew and split the large partitions into smaller sub-partitions, joining them separately to balance the load.",
    "good_code": "// Enable AQE and use Skew Hint in Spark SQL\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\");\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\");\n\nDataset<Row> result = spark.sql(\"SELECT /*+ SKEW('df1') */ * FROM df1 JOIN df2 ON df1.key = df2.key\");",
    "verification": "Monitor the Spark UI 'Stages' tab. Verify that the 'Max' task duration and memory usage are close to the 'Median' values, indicating a balanced distribution.",
    "date": "2026-05-14",
    "id": 1778756985,
    "type": "error"
});