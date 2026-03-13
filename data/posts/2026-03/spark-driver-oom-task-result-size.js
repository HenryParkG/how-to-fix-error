window.onPostDataLoaded({
    "title": "Mitigating Spark Driver OOMs from Task Result Bloat",
    "slug": "spark-driver-oom-task-result-size",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "BigData",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark drivers often crash with OutOfMemoryError (OOM) when the cumulative size of task results sent back from executors exceeds the driver's available heap. This typically occurs during actions like <code>.collect()</code>, but also happens when tasks return large metadata, accumulators, or when <code>spark.driver.maxResultSize</code> is set too high or is unbounded. Even if the total data is less than the heap, the overhead of Java object serialization can cause the driver to thrash during garbage collection before failing.</p>",
    "root_cause": "Aggregating large datasets into the driver's memory space instead of persisting them or using distributed transformations.",
    "bad_code": "// Dangerous: Pulls all partition data to driver memory\nList<Row> results = sparkSession.sql(\"SELECT * FROM massive_table\").collectAsList();\nfor(Row r : results) {\n    processLocally(r);\n}",
    "solution_desc": "Instead of collecting data to the driver, use distributed writes or the `toLocalIterator()` method to stream results one by one. Additionally, configure `spark.driver.maxResultSize` to a sensible limit (e.g., 2g) to fail fast rather than hanging the cluster, and increase `spark.driver.memory` if metadata overhead is the bottleneck.",
    "good_code": "// Better: Stream results using an iterator to save driver memory\nDataset<Row> df = sparkSession.sql(\"SELECT * FROM massive_table\");\nIterator<Row> iter = df.toLocalIterator();\nwhile(iter.hasNext()) {\n    processLocally(iter.next());\n}\n\n// OR: Configuration fix in SparkConf\n// sparkConf.set(\"spark.driver.maxResultSize\", \"2g\");\n// sparkConf.set(\"spark.driver.memory\", \"4g\");",
    "verification": "Monitor the Spark UI 'Executors' tab. Check the 'Driver' row for memory usage spikes during the action phase. Verification is successful if memory stays stable and the job completes or throws a controlled MaxResultSize exceeded exception.",
    "date": "2026-03-13",
    "id": 1773384034,
    "type": "error"
});