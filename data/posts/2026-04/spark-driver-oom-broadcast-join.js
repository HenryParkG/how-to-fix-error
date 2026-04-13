window.onPostDataLoaded({
    "title": "Mitigating Spark Driver OOM from Broadcast Metadata",
    "slug": "spark-driver-oom-broadcast-join",
    "language": "Python",
    "code": "OutOfMemoryError",
    "tags": [
        "Python",
        "SQL",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, a Broadcast Join involves collecting data from executors to the driver before distributing it back to all executors. If the metadata or the data itself exceeds the allocated memory of the driver node, the entire Spark Context crashes with an OutOfMemory (OOM) error despite the executors having plenty of overhead.</p>",
    "root_cause": "The driver attempts to serialize and store a dataset that exceeds the 'spark.driver.maxResultSize' or the physical RAM allocated to the driver process.",
    "bad_code": "from pyspark.sql.functions import broadcast\n# Large lookup table accidentally treated as small\nlarge_df = spark.table(\"huge_dim_table\")\nresult = fact_df.join(broadcast(large_df), \"id\")",
    "solution_desc": "Increase the driver memory allocation, set a cap on the broadcast threshold, or switch to a SortMergeJoin if the 'small' side of the join is actually several gigabytes in size.",
    "good_code": "# 1. Increase driver memory in configuration\n# spark.driver.memory 8g\n\n# 2. Use automatic threshold instead of forced broadcast\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", 10 * 1024 * 1024) # 10MB\n\n# Join without forced broadcast hint\nresult = fact_df.join(large_df, \"id\")",
    "verification": "Review Spark UI 'Environment' and 'Executors' tabs to ensure driver memory usage stays below 70% during the 'Collecting results' stage of the Join.",
    "date": "2026-04-13",
    "id": 1776066575,
    "type": "error"
});