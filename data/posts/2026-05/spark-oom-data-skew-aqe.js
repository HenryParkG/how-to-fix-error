window.onPostDataLoaded({
    "title": "Mitigating Spark OOM via Adaptive Query Execution",
    "slug": "spark-oom-data-skew-aqe",
    "language": "Scala",
    "code": "OutOfMemoryError",
    "tags": [
        "SQL",
        "Infra",
        "Spark",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Broadcast Hash Join (BHJ) is efficient but prone to OutOfMemory (OOM) errors when data skew occurs. Even if the table size is below the threshold, a skewed partition can exceed the executor's memory limits during the hash table build phase. Adaptive Query Execution (AQE) allows Spark to re-optimize query plans at runtime based on actual statistics from completed stages, enabling it to detect skew and switch from BHJ to a SortMergeJoin or perform skew-join optimization by splitting large partitions.</p>",
    "root_cause": "Executor memory exhaustion caused by a skewed partition in a broadcasted table exceeding the allocated JVM heap space.",
    "bad_code": "val joinedDF = df1.hint(\"broadcast\").join(df2, \"id\")\n// Forcing a broadcast on a table that has\n// highly skewed keys leads to OOM at runtime.",
    "solution_desc": "Enable AQE and Skew Join optimization. Remove hardcoded broadcast hints and let the optimizer decide the join strategy based on runtime statistics.",
    "good_code": "spark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\nspark.conf.set(\"spark.sql.autoBroadcastJoinThreshold\", \"10MB\")\n\nval joinedDF = df1.join(df2, \"id\") // No hint, let AQE handle it",
    "verification": "Check the Spark UI 'SQL' tab to confirm 'SortMergeJoin' with 'skew' optimization labels appear in the physical plan.",
    "date": "2026-05-10",
    "id": 1778407561,
    "type": "error"
});