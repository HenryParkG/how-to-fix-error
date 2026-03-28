window.onPostDataLoaded({
    "title": "Resolving Spark Catalyst OOMs in Nested JSON",
    "slug": "spark-catalyst-oom-nested-json",
    "language": "Java",
    "code": "CatalystOOM",
    "tags": [
        "Java",
        "Backend",
        "Spark",
        "Error Fix"
    ],
    "analysis": "<p>Spark's Catalyst optimizer uses recursive tree transformations to plan queries. When encountering deeply nested JSON schemas (e.g., hundreds of levels of nesting), the optimizer can exhaust the JVM heap or stack during the 'Analyzer' or 'Optimizer' phases. This is particularly prevalent when using 'schema inference' on massive, heterogeneous datasets where the resulting schema tree is excessively complex.</p>",
    "root_cause": "StackOverflow or Heap OOM due to recursive expression evaluation in the Catalyst optimizer's rule-based engine.",
    "bad_code": "Dataset<Row> df = spark.read().option(\"inferSchema\", \"true\").json(\"path/to/nested.json\");\ndf.select(\"deeply.nested.field.structure.goes.here\").collect();",
    "solution_desc": "Explicitly define a pruned schema instead of using inference, and enable nested schema pruning. If nesting is too deep, use 'from_json' on specific columns to defer parsing.",
    "good_code": "StructType schema = new StructType().add(\"top\", DataTypes.StringType);\nDataset<Row> df = spark.read().schema(schema).json(\"path/to/nested.json\");\nspark.conf().set(\"spark.sql.optimizer.nestedSchemaPruning.enabled\", \"true\");",
    "verification": "Check Spark UI's 'Environment' tab to confirm 'nestedSchemaPruning' is active and monitor driver heap usage during planning.",
    "date": "2026-03-28",
    "id": 1774673298,
    "type": "error"
});