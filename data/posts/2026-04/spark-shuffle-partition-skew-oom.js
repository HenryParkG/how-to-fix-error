window.onPostDataLoaded({
    "title": "Resolving Spark Shuffle Partition Skew OOM in ETL",
    "slug": "spark-shuffle-partition-skew-oom",
    "language": "Python/Scala",
    "code": "OutOfMemoryError",
    "tags": [
        "Python",
        "SQL",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Spark shuffle skew occurs when data is unevenly distributed across partitions during a join or aggregation. One executor may receive 90% of the data for a specific key, leading to disk spilling and eventually a Java Heap Space OOM, while other executors remain idle.</p>",
    "root_cause": "The join key has high cardinality bias (e.g., many NULL values or a single 'default' ID) causing a single partition to exceed executor memory.",
    "bad_code": "# Standard join on a skewed key\ndf_large.join(df_skewed, \"user_id\")",
    "solution_desc": "Implement 'Salting' by adding a random suffix to the join key in the skewed table and replicating the rows in the small table to distribute the data across multiple partitions.",
    "good_code": "from pyspark.sql import functions as F\n# Add salt to distribute keys\ndf_skewed = df_skewed.withColumn(\"salt\", (F.rand() * 10).cast(\"int\"))\ndf_large = df_large.withColumn(\"salt_list\", F.array([F.lit(i) for i in range(10)]))\ndf_large = df_large.withColumn(\"salt\", F.explode(\"salt_list\"))\n# Join on salted keys\nresult = df_large.join(df_skewed, [\"user_id\", \"salt\"])",
    "verification": "Check the Spark UI 'Stages' tab to ensure 'Max' task duration is close to the 'Median' duration.",
    "date": "2026-04-25",
    "id": 1777110200,
    "type": "error"
});