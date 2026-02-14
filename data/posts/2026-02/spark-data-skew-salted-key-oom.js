window.onPostDataLoaded({
    "title": "Spark Data Skew: Fixing Salted Key Shuffle OOM",
    "slug": "spark-data-skew-salted-key-oom",
    "language": "Scala",
    "code": "OOM (Out of Memory)",
    "tags": [
        "Java",
        "Backend",
        "Spark",
        "Error Fix"
    ],
    "analysis": "<p>In distributed processing, data skew occurs when a small number of keys contain the vast majority of the data. During a Join or GroupBy operation, Spark hashes keys to determine their destination partition. If one key (e.g., 'null' or a generic category) is massive, a single executor will be overwhelmed with data, leading to a Shuffle OOM.</p><p>The Salted Key technique redistributes this concentrated data by appending a random suffix to the skewed key, breaking the single large partition into multiple smaller ones.</p>",
    "root_cause": "Uneven distribution of records across partitions causing a single JVM executor to exceed its heap memory limit during the shuffle phase.",
    "bad_code": "val df1 = spark.table(\"large_sales\") // Skewed on 'store_id'\nval df2 = spark.table(\"stores\")\n\n// This join fails if store_id '101' has 50% of all rows\nval joined = df1.join(df2, \"store_id\")",
    "solution_desc": "Apply 'salting' to the skewed key in the large table by adding a random integer. In the small table (dimension table), explode the records so each original key matches every possible salt value, ensuring the join can still complete.",
    "good_code": "val saltNum = 10\nval df1Salted = df1.withColumn(\"salt\", (rand * saltNum).cast(\"int\"))\n    .withColumn(\"join_key\", concat($\"store_id\", lit(\"_\"), $\"salt\"))\n\nval df2Exploded = df2.withColumn(\"salt\", explode(array((0 until saltNum).map(lit): _*)))\n    .withColumn(\"join_key\", concat($\"store_id\", lit(\"_\"), $\"salt\"))\n\nval result = df1Salted.join(df2Exploded, \"join_key\")",
    "verification": "Monitor the Spark UI. Look for 'Max' vs 'Median' task duration in the 'Stages' tab. Salted joins should show uniform task times across all executors.",
    "date": "2026-02-14",
    "id": 1771031662,
    "type": "error"
});