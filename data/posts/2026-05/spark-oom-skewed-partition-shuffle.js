window.onPostDataLoaded({
    "title": "Eliminating Spark OOMs from Skewed Partition Shuffles",
    "slug": "spark-oom-skewed-partition-shuffle",
    "language": "Java",
    "code": "Executor OOM",
    "tags": [
        "Java",
        "SQL",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>Spark Executor Out-of-Memory (OOM) errors during the shuffle phase are almost always a symptom of data skew. When a specific key (e.g., a null ID or a high-frequency category) is processed, Spark hashes all records with that key to a single partition. If one partition grows larger than the available executor heap memory or exceeds the 2GB limit for a single shuffle block, the task fails. This 'bloat' prevents the JVM from garbage collecting effectively, leading to frequent GC pauses and eventual termination.</p>",
    "root_cause": "Data skew causing an uneven distribution of records across shuffle partitions, where a single task is forced to process a disproportionately large volume of data compared to its peers.",
    "bad_code": "// Standard join on a skewed key column\nval joinedDF = ordersDF.join(customersDF, \"customer_id\")\n// If customer_id '1' has 10 million rows, one executor will crash.",
    "solution_desc": "The most robust fix is 'Salting'. This involves appending a random integer to the join key in the skewed large dataset and replicating the rows in the smaller dataset to match those salted keys. Alternatively, enable Spark 3.0+ Adaptive Query Execution (AQE) skew join optimization, which automatically splits large partitions into smaller sub-partitions.",
    "good_code": "// Salting approach\nval saltValue = scala.util.Random.nextInt(10)\nval saltedLeft = ordersDF.withColumn(\"salted_key\", concat($\"customer_id\", lit(\"_\"), lit(saltValue)))\nval explodedRight = customersDF.withColumn(\"salt\", explode(array((0 to 9).map(lit): _*)))\n    .withColumn(\"salted_key\", concat($\"customer_id\", lit(\"_\"), $\"salt\"))\nval result = saltedLeft.join(explodedRight, \"salted_key\")",
    "verification": "Monitor the Spark UI 'Stages' tab. Verify that the 'Max' task duration and 'Shuffle Read Size' are within 2x of the 'Median'.",
    "date": "2026-05-02",
    "id": 1777715665,
    "type": "error"
});