window.onPostDataLoaded({
    "title": "Resolving Spark Shuffle Skew & Driver OOM Cascades",
    "slug": "spark-shuffle-skew-disk-spill-driver-oom-fix",
    "language": "Apache Spark",
    "code": "OutOfMemoryError: Java heap space",
    "tags": [
        "SQL",
        "Java",
        "Kubernetes",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark distributed workloads, data skew occurs when join or grouping keys are distributed unevenly across partitions. Straggling tasks handling hot keys process orders of magnitude more data than average partitions, forcing executor memory exhaustion, aggressive disk spills (both memory and disk spill storms), and executor heartbeat timeouts.</p><p>When heavily skewed tasks fail due to timeouts or JVM garbage collection pauses, Spark attempts retries. The repeated task failures generate explosive executor status metrics and stage metadata sent back to the Spark Driver, ultimately causing a Driver OutOfMemoryError (OOM) cascade.</p>",
    "root_cause": "Key distribution imbalance causes executor partition spill storms, leading to GC timeouts, task failure retries, and high-cardinality task status metadata flooding the Driver memory.",
    "bad_code": "-- Skewed join between high-volume events and dimension tables\n-- Hot keys (e.g., tenant_id = 'DEFAULT' or NULL) cause 99% of data to land on a single shuffle partition\nSELECT \n    e.tenant_id,\n    e.event_name,\n    COUNT(e.event_id) AS event_count,\n    d.dimension_name\nFROM events e\nJOIN dimensions d ON e.tenant_id = d.tenant_id\nGROUP BY e.tenant_id, e.event_name, d.dimension_name;",
    "solution_desc": "Architectural remedy involves three layers: 1) Enable Adaptive Query Execution (AQE) with skew join optimization; 2) Apply key salting to uniformly distribute hot keys across randomized sub-partitions; 3) Isolate and filter out NULL/default keys prior to heavy shuffle stages.",
    "good_code": "-- Enable Spark Adaptive Query Execution & Skew Join Handlers\n-- SET spark.sql.adaptive.enabled = true;\n-- SET spark.sql.adaptive.skewJoin.enabled = true;\n-- SET spark.sql.adaptive.skewJoin.skewedPartitionFactor = 5;\n-- SET spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes = 268435456;\n\nWITH salted_events AS (\n    SELECT \n        event_id,\n        event_name,\n        tenant_id,\n        -- Salt hot keys using uniform random hash prefix (0 to 15)\n        CONCAT(tenant_id, '_', CAST(FLOOR(RAND() * 16) AS STRING)) AS salted_key\n    FROM events\n    WHERE tenant_id IS NOT NULL\n),\nsalted_dimensions AS (\n    SELECT \n        tenant_id,\n        dimension_name,\n        -- Replicate dimension rows across all 16 salt buckets\n        CONCAT(tenant_id, '_', CAST(i AS STRING)) AS salted_key\n    FROM dimensions\n    LATERAL VIEW EXPLODE(SEQUENCE(0, 15)) s AS i\n)\nSELECT \n    e.tenant_id,\n    e.event_name,\n    COUNT(e.event_id) AS event_count,\n    d.dimension_name\nFROM salted_events e\nJOIN salted_dimensions d ON e.salted_key = d.salted_key\nGROUP BY e.tenant_id, e.event_name, d.dimension_name;",
    "verification": "Inspect the Spark Web UI Stage view. Ensure task execution times and shuffle read sizes have a low standard deviation across all partitions, with 0 bytes spilled to disk and Driver memory remaining flat.",
    "date": "2026-08-21",
    "id": 1787304770,
    "type": "error"
});