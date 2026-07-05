window.onPostDataLoaded({
    "title": "Fix Spark OOM Errors from Broadcast Join Memory Skew",
    "slug": "spark-oom-broadcast-join-memory-skew",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Spark",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, Broadcast Hash Joins (BHJ) are highly optimized operations where a small table is distributed to all executor nodes to bypass expensive shuffling. However, if the small table contains highly skewed keys or if Spark underestimates its actual in-memory size due to compression mismatches, the serialized object array sent to executors can inflate dramatically. Upon deserialization, this causes the Spark JVM heap to exceed limits, throwing an <code>OutOfMemoryError</code> during task execution.</p>",
    "root_cause": "Spark estimates the size of datasets based on static statistics or compressed disk footprints. If skew is present, or if compression is highly efficient, the in-memory deserialized representation of the broadcast table exceeds the physical limits allocated to execution memory.",
    "bad_code": "import org.apache.spark.sql.Dataset;\nimport org.apache.spark.sql.Row;\nimport static org.apache.spark.sql.functions.broadcast;\n\npublic class SparkJoiner {\n    public void executeJoin(Dataset<Row> largeDF, Dataset<Row> skewedDF) {\n        // BAD: Forcing a broadcast join on a dataset that has significant skew \n        // or underreported footprint, leading to executor memory crashes.\n        Dataset<Row> result = largeDF.join(broadcast(skewedDF), \"join_key\");\n        result.write().mode(\"overwrite\").parquet(\"/output/data\");\n    }\n}",
    "solution_desc": "Avoid manual broadcast hinting on unpredictable or skewed datasets. Use a Shuffled Hash Join or Sort Merge Join instead. If a broadcast join is mandatory, first apply salting to partition the skew, or adjust `spark.sql.autoBroadcastJoinThreshold` to dynamically prevent Spark from broadcasting oversized dataframes.",
    "good_code": "import org.apache.spark.sql.Dataset;\nimport org.apache.spark.sql.Row;\n\npublic class SparkJoinerFixed {\n    public void executeJoin(Dataset<Row> largeDF, Dataset<Row> skewedDF) {\n        // GOOD: Rely on Sort-Merge Join or Shuffled Hash Join with explicit salting\n        // configured dynamically, avoiding high memory broadcast paths.\n        largeDF.sparkSession().conf().set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\");\n        \n        // Remove explicit broadcast hint to let AQE (Adaptive Query Execution) handle optimization\n        Dataset<Row> result = largeDF.join(skewedDF, \"join_key\");\n        result.write().mode(\"overwrite\").parquet(\"/output/data\");\n    }\n}",
    "verification": "Monitor execution in the Spark UI. Ensure the physical query plan displays `SortMergeJoin` or `ShuffledHashJoin` rather than `BroadcastHashJoin`, and confirm the executors do not run into memory-limit GC overhead failures.",
    "date": "2026-07-05",
    "id": 1783249163,
    "type": "error"
});