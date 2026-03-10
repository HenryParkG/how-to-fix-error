window.onPostDataLoaded({
    "title": "Fixing Spark AQE Skew in High-Cardinality Joins",
    "slug": "spark-aqe-skew-high-cardinality",
    "language": "SQL",
    "code": "DataSkew",
    "tags": [
        "SQL",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Adaptive Query Execution (AQE) in Spark 3.x is designed to handle skew automatically by splitting large partitions. However, when dealing with high-cardinality joins where the skew is distributed across millions of distinct keys (e.g., tracking IDs), AQE's default thresholding often fails to trigger or creates an excessive number of small tasks, leading to 'ResultStage' hang or OOM on executors due to shuffling overhead.</p>",
    "root_cause": "The skewed partition exceeds 'spark.sql.adaptive.advisoryPartitionSizeInBytes' but doesn't meet the 'skewColumnMaxAllowedSize' ratio, or salt cardinality is too low.",
    "bad_code": "SELECT /*+ MERGE(a, b) */ * \nFROM large_fact a \nJOIN high_card_dim b \nON a.user_id = b.user_id",
    "solution_desc": "Implement manual salting by appending a random integer to the join key on the skewed side and replicating the dimension side. This forces Spark to distribute the 'hot' keys across multiple physical partitions regardless of AQE settings.",
    "good_code": "SELECT * FROM (\n  SELECT *, CAST(RAND() * 10 AS INT) as salt FROM large_fact\n) a \nJOIN (\n  SELECT *, explode(sequence(0, 9)) as salt FROM high_card_dim\n) b \nON a.user_id = b.user_id AND a.salt = b.salt",
    "verification": "Check the Spark UI 'SQL' tab to ensure the Join stage has a balanced distribution of 'Shuffle Read Size' across all tasks.",
    "date": "2026-03-10",
    "id": 1773116857,
    "type": "error"
});