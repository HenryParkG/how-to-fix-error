window.onPostDataLoaded({
    "title": "Fixing Spark Driver OOM from RDD Lineage Growth",
    "slug": "spark-rdd-lineage-driver-oom",
    "language": "Scala",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Spark",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, every RDD maintains a 'lineage'\u2014a Directed Acyclic Graph (DAG) of transformations required to compute it. In long-running iterative algorithms (like PageRank, BFS, or custom ML loops), an RDD is updated repeatedly in a loop. Since RDDs are immutable, each iteration creates a new RDD that references the previous one. Over hundreds of iterations, the lineage chain becomes massive. Because the Spark Driver must store and track these metadata objects for job scheduling and fault tolerance, the Driver's JVM heap eventually exhausts, leading to a crash.</p>",
    "root_cause": "The accumulation of RDD metadata in the Driver's memory due to an excessively long lineage chain in iterative loops.",
    "bad_code": "var rdd = sc.parallelize(1 to 1000)\nfor (i <- 1 to 5000) {\n    rdd = rdd.map(x => x + i).filter(_ % 2 == 0)\n}\nrdd.collect() // Driver crashes here after thousands of lineage links",
    "solution_desc": "The standard fix is to truncate the lineage using `checkpoint()`. This saves the RDD data to a reliable storage (like HDFS) and forgets the previous lineage. For better performance when local disks are reliable, `localCheckpoint()` can be used to truncate lineage without the overhead of HDFS writes.",
    "good_code": "sc.setCheckpointDir(\"/tmp/spark-checkpoint\")\nvar rdd = sc.parallelize(1 to 1000)\nfor (i <- 1 to 5000) {\n    rdd = rdd.map(x => x + i)\n    if (i % 100 == 0) {\n        rdd.checkpoint() // Truncates lineage every 100 iterations\n    }\n}\nrdd.collect()",
    "verification": "Monitor the Spark UI 'Stages' tab. If the DAG visualization simplifies periodically and the Driver's memory usage (via JConsole or Spark Metrics) stays flat, the lineage is being truncated correctly.",
    "date": "2026-02-23",
    "id": 1771829745,
    "type": "error"
});