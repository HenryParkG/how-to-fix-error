window.onPostDataLoaded({
    "title": "Fixing Spark Executor OOMs in Broadcast Joins",
    "slug": "fixing-spark-executor-ooms-broadcast-hash-join-skew",
    "language": "Java",
    "code": "Spark Executor OOM",
    "tags": [
        "Spark",
        "Memory Skew",
        "Java",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Broadcast Hash Joins (BHJ) in Apache Spark speed up joins by broadcasting small datasets to all executors. However, when the broadcast table has memory skew or when uncompressed memory size vastly exceeds estimated broadcast size thresholds, driver estimation passes, but target executor JVM heap crashes with java.lang.OutOfMemoryError: Java heap space.</p>",
    "root_cause": "Spark driver estimates broadcast table size based on compressed on-disk format or basic statistics. When deserialized on executor JVM heaps, object overhead and skewed key distributions cause memory consumption to far exceed spark.sql.autoBroadcastJoinThreshold, exhausting executor memory.",
    "bad_code": "from pyspark.sql import functions as F\n\n# Forcing broadcast join on table with uncompressed heap overhead\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"100MB\")\n\ndf_large = spark.table(\"large_fact_events\")\ndf_skewed = spark.table(\"skewed_user_metadata\") # 80MB on disk, 1.2GB in JVM heap\n\n# Triggers Executor OutOfMemoryError during build phase\nresult = df_large.join(F.broadcast(df_skewed), \"user_id\")\nresult.write.mode(\"overwrite\").parquet(\"/tmp/output\")",
    "solution_desc": "Disable aggressive auto-broadcast threshold or leverage Spark Adaptive Query Execution (AQE) with skew join handling. Alternatively, use explicit SortMergeJoin hints or key salting to redistribute skewed broadcast keys safely across executor tasks.",
    "good_code": "from pyspark.sql import functions as F\n\n# Enable AQE and dynamic skew join handling\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n\n# Disable unsafe auto-broadcast or limit to safely dimensioned tables\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"-1\")\n\ndf_large = spark.table(\"large_fact_events\")\ndf_skewed = spark.table(\"skewed_user_metadata\")\n\n# Fallback to shuffle merge join to prevent single-executor heap spill\nresult = df_large.hint(\"SHUFFLE_MERGE\").join(df_skewed, \"user_id\")\nresult.write.mode(\"overwrite\").parquet(\"/tmp/output\")",
    "verification": "Monitor Spark UI Executor tab during job execution; verify memory usage stays balanced below 80% peak heap usage without dynamic executor failures or broadcast task OOM crashes.",
    "date": "2026-08-09",
    "id": 1786257536,
    "type": "error"
});