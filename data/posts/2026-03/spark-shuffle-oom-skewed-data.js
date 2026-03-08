window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle-Stage OOMs in Skewed Data",
    "slug": "spark-shuffle-oom-skewed-data",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Backend",
        "BigData",
        "Error Fix"
    ],
    "analysis": "<p>Apache Spark Shuffle-Stage OutOfMemory (OOM) errors frequently occur during Join or GroupBy operations when data is unevenly distributed across keys. In a shuffle, all records with the same key are sent to the same partition. If one key (e.g., 'NULL' or a generic category) has millions of rows while others have dozens, a single executor will be overwhelmed, leading to 'Java heap space' or 'GC overhead limit exceeded' errors.</p>",
    "root_cause": "Data skew causes a single shuffle partition to grow larger than the available executor memory during a wide transformation.",
    "bad_code": "// Standard join on a skewed key\nval joinedDF = ordersDF.join(customersDF, \"customer_id\")\njoinedDF.write.parquet(\"/output/data\")",
    "solution_desc": "Implement 'Salting'. Add a random integer suffix to the join key in the skewed table and explode the matching key in the dimension table to redistribute data across multiple partitions.",
    "good_code": "// Salting logic\nval saltValue = scala.util.Random.nextInt(10)\nval skewedDF = ordersDF.withColumn(\"salt\", (monotonically_increasing_id() % 10))\n  .withColumn(\"salted_key\", concat(col(\"customer_id\"), lit(\"_\"), col(\"salt\")))\n\nval dimDF = customersDF.withColumn(\"salt\", explode(array((0 until 10).map(lit): _*)))\n  .withColumn(\"salted_key\", concat(col(\"customer_id\"), lit(\"_\"), col(\"salt\")))\n\nval joinedDF = skewedDF.join(dimDF, \"salted_key\")",
    "verification": "Monitor the Spark UI 'Stages' tab. Verify that 'Max' shuffle read size is close to the 'Median' and that no single task takes significantly longer than others.",
    "date": "2026-03-08",
    "id": 1772944140,
    "type": "error"
});