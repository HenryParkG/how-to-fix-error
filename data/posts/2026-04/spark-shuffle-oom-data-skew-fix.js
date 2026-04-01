window.onPostDataLoaded({
    "title": "Resolving Spark Shuffle OOMs in Skewed Multi-Stage Joins",
    "slug": "spark-shuffle-oom-data-skew-fix",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "SQL",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Spark jobs involving multi-stage joins, data skew often leads to specific executors processing significantly larger partitions than others. When these partitions exceed the available heap space during the shuffle phase, the executor crashes with an OutOfMemoryError (OOM).</p><p>This is common in 'many-to-one' join scenarios where a single key (e.g., a null value or a default ID) accounts for a massive percentage of the dataset, causing a massive shuffle spill and subsequent memory exhaustion.</p>",
    "root_cause": "Uneven distribution of data across shuffle partitions causing a single executor to exceed 'spark.executor.memory' during the merge-sort phase of a Join.",
    "bad_code": "Dataset<Row> result = df1.join(df2, \"common_id\"); // Standard join without skew handling",
    "solution_desc": "Implement 'Salting' to redistribute skewed keys by appending a random suffix to the join key in the large table and duplicating keys in the smaller table, or use Spark 3.x Skew Join hints.",
    "good_code": "// Spark 3.x Skew Hint\nDataset<Row> result = df1.hint(\"skew\", \"common_id\").join(df2, \"common_id\");\n\n// Alternative: Salting manually\nColumn saltedKey = concat(col(\"common_id\"), lit(\"_\"), floor(rand().multiply(10)));",
    "verification": "Check Spark UI Shuffle Read Size. Fixed jobs will show uniform partition sizes instead of a few 'long-tail' partitions.",
    "date": "2026-04-01",
    "id": 1775007975,
    "type": "error"
});