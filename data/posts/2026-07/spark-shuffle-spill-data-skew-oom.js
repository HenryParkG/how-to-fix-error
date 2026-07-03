window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Spill and Skew OOMs",
    "slug": "spark-shuffle-spill-data-skew-oom",
    "language": "Scala/Spark",
    "code": "OOM / Spill",
    "tags": [
        "Apache Spark",
        "Scala",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Spark, data skew occurs when partition keys are unevenly distributed across the dataset. During wide transformations such as <code>join</code>, <code>groupByKey</code>, or <code>reduceByKey</code>, Spark hashes keys to assign them to reducers. If one key has millions of records while other keys have only a few, the executor handling the skewed key will be overwhelmed. This leads to massive shuffle spills to disk, GC overhead limits exceeded, and eventual OutOfMemory (OOM) errors (container exit code 137), while other executors sit idle.</p>",
    "root_cause": "A non-uniform distribution of join or grouping keys causes a single partition to grow beyond the executor's available JVM memory limit during the shuffle phase.",
    "bad_code": "import org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder().appName(\"SkewedJoin\").getOrCreate()\nimport spark.implicits._\n\n// Large transactional dataset skewed heavily on a default/null 'user_id' (e.g., ID = 0)\nval transactionsDF = spark.read.parquet(\"/data/transactions\") \nval usersDF = spark.read.parquet(\"/data/users\")\n\n// BUG: Direct join on heavily skewed 'user_id' key will trigger OOM on partition executors\nval joinedDF = transactionsDF.join(usersDF, \"user_id\")\njoinedDF.write.parquet(\"/output/joined_data\")",
    "solution_desc": "Implement 'key salting' on the skewed dataset. We append a random integer (the salt) to the join key in the skewed dataframe, and duplicate the lookup dataframe keys to match the salt range. This redistributes the skewed key across multiple target partitions, transforming a single massive partition join into multiple smaller, parallelizable joins.",
    "good_code": "import org.apache.spark.sql.SparkSession\nimport org.apache.spark.sql.functions._\n\nval spark = SparkSession.builder().appName(\"SaltedJoin\").getOrCreate()\nimport spark.implicits._\n\nval transactionsDF = spark.read.parquet(\"/data/transactions\")\nval usersDF = spark.read.parquet(\"/data/users\")\n\nval SALT_FACTOR = 10\n\n// 1. Salt the transaction DF by appending a random integer to the skewed key\nval saltedTransactions = transactionsDF.withColumn(\"salted_user_id\", \n  concat($\"user_id\", lit(\"_\"), round(rand() * (SALT_FACTOR - 1)))\n)\n\n// 2. Replicate lookup DF by exploding it with all possible salt values\nval saltExplodeDF = spark.range(0, SALT_FACTOR).toDF(\"salt\")\nval explodedUsers = usersDF\n  .crossJoin(saltExplodeDF)\n  .withColumn(\"salted_user_id\", concat($\"user_id\", lit(\"_\"), $\"salt\"))\n\n// 3. Perform join on the distributed salted keys, then drop auxiliary columns\nval joinedDF = saltedTransactions\n  .join(explodedUsers, \"salted_user_id\")\n  .drop(\"salted_user_id\", \"salt\")\n\njoinedDF.write.parquet(\"/output/salted_joined_data\")",
    "verification": "Monitor the Spark Web UI. Check the 'Stages' tab and inspect the task metrics. The distribution of 'Shuffle Read Size' and 'Task Executor Run Time' should show a uniform distribution across all tasks instead of a single task consuming hours while others finish in seconds, with 'Shuffle Spill (Memory/Disk)' dropping to 0.",
    "date": "2026-07-03",
    "id": 1783059830,
    "type": "error"
});