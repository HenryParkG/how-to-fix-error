window.onPostDataLoaded({
    "title": "Resolving Spark Shuffle Partition Skew in Joins",
    "slug": "spark-shuffle-partition-skew-joins",
    "language": "Java/Scala",
    "code": "Data Skew",
    "tags": [
        "SQL",
        "Infra",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>Shuffle partition skew occurs when data distribution across join keys is non-uniform. In large-scale joins, a few keys might represent the majority of the dataset (e.g., null values or 'default' IDs). During the shuffle phase, Spark sends all records with the same key to a single partition.</p><p>This results in 'straggler' tasks where one executor processes gigabytes of data while others finish in seconds, often leading to FetchFailedExceptions or OutOfMemory (OOM) errors on the skewed executor.</p>",
    "root_cause": "An uneven distribution of join keys causing a single shuffle partition to exceed the memory capacity or processing time limits of a single executor.",
    "bad_code": "// Standard join susceptible to skew\nval joinedDF = largeDF.join(skewedDF, \"join_key\")",
    "solution_desc": "Implement 'salting' by adding a random suffix to the join key in the skewed table and replicating rows in the other table, or enable Spark 3.0+ Adaptive Query Execution (AQE) skew join optimization.",
    "good_code": "// Enable AQE Skew Join\nspark.conf.set(\"spark.sql.adaptive.enabled\", \"true\")\nspark.conf.set(\"spark.sql.adaptive.skewJoin.enabled\", \"true\")\n\n// Manual Salting approach\nval saltedDF = skewedDF.withColumn(\"salt\", (rand() * 10).cast(\"int\"))\nval largeSaltedDF = largeDF.withColumn(\"salt\", explode(array((0 until 10).map(lit): _*)))",
    "verification": "Check the Spark UI 'Stages' tab to confirm that max task duration is comparable to median task duration.",
    "date": "2026-03-16",
    "id": 1773654991,
    "type": "error"
});