window.onPostDataLoaded({
    "title": "Fix Spark Driver OOM Outages from Uncollected Broadcast Vars",
    "slug": "fix-spark-driver-oom-uncollected-broadcast-variables",
    "language": "Scala / Spark",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Spark",
        "Scala",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In iterative Apache Spark applications (such as iterative machine learning routines, GraphX algorithms, or streaming batch loops), creating broadcast variables inside loop iterations without explicitly unpersisting or destroying them causes severe memory leaks on the Spark Driver node. Each call to <code>sc.broadcast()</code> stores data objects in the Driver's BlockManager memory and retains strong references in the Context Cleaner registry. Over multiple iterations, heap allocation on the Driver is exhausted, resulting in a fatal <code>java.lang.OutOfMemoryError: Java heap space</code> crash.</p>",
    "root_cause": "Accumulation of stale broadcast variable references in the Spark Driver memory across iterative loop execution without invoking unpersist() or destroy().",
    "bad_code": "import org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder().appName(\"IterativeJob\").getOrCreate()\nimport spark.implicits._\n\nvar modelWeights = Map(1 -> 0.5, 2 -> 0.8)\n\nfor (iteration <- 1 to 1000) {\n  // Creates a new Broadcast instance in memory EVERY iteration without cleanup\n  val broadcastWeights = spark.sparkContext.broadcast(modelWeights)\n  \n  val df = spark.read.parquet(s\"s3a://data-bucket/input_step_$iteration.parquet\")\n  \n  val processed = df.map(row => {\n    val weights = broadcastWeights.value\n    // processing logic\n    row.getAs[Int](\"id\") * weights.getOrElse(1, 1.0)\n  })\n  \n  processed.write.mode(\"overwrite\").parquet(s\"s3a://data-bucket/output_step_$iteration.parquet\")\n  // broadcastWeights remains locked in Driver heap memory!\n}",
    "solution_desc": "Explicitly call `.unpersist(blocking = true)` or `.destroy()` on every broadcast variable at the end of each iteration to immediately free up Driver BlockManager memory and Context Cleaner references.",
    "good_code": "import org.apache.spark.sql.SparkSession\nimport org.apache.spark.broadcast.Broadcast\n\nval spark = SparkSession.builder().appName(\"IterativeJob\").getOrCreate()\nimport spark.implicits._\n\nvar modelWeights = Map(1 -> 0.5, 2 -> 0.8)\n\nfor (iteration <- 1 to 1000) {\n  var broadcastWeights: Broadcast[Map[Int, Double]] = null\n  try {\n    broadcastWeights = spark.sparkContext.broadcast(modelWeights)\n    \n    val df = spark.read.parquet(s\"s3a://data-bucket/input_step_$iteration.parquet\")\n    \n    val processed = df.map(row => {\n      val weights = broadcastWeights.value\n      row.getAs[Int](\"id\") * weights.getOrElse(1, 1.0)\n    })\n    \n    processed.write.mode(\"overwrite\").parquet(s\"s3a://data-bucket/output_step_$iteration.parquet\")\n  } finally {\n    if (broadcastWeights != null) {\n      // Blocking unpersist frees driver and executor memory synchronously\n      broadcastWeights.unpersist(blocking = true)\n      broadcastWeights.destroy()\n    }\n  }\n}",
    "verification": "Attach JConsole or Spark Web UI (Executors tab / Storage tab) to the Driver process during long-running iterations. Verify that Driver Memory usage remains flat across hundreds of iterations rather than continuously climbing to heap exhaustion.",
    "date": "2026-08-02",
    "id": 1785649669,
    "type": "error"
});