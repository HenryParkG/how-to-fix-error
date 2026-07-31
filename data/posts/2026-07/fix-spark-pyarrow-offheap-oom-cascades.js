window.onPostDataLoaded({
    "title": "Fix PyArrow Vectorized UDF Off-Heap OOM Cascades in Spark",
    "slug": "fix-spark-pyarrow-offheap-oom-cascades",
    "language": "Python",
    "code": "OOMKilled",
    "tags": [
        "Python",
        "Apache Spark",
        "PyArrow",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When executing PyArrow vectorized Pandas UDFs in Apache Spark, memory allocation happens off-heap using Arrow C++ memory pools. Standard executor memory configurations (`spark.executor.memory`) only control JVM heap. If PyArrow batch sizes or off-heap overhead limits (`spark.executor.memoryOverhead`) are unconstrained, Arrow memory allocations overflow the Linux cgroup limit, causing kernel OOM killer terminations (Exit Code 137) that cascade across Spark workers.</p>",
    "root_cause": "PyArrow buffers batch data off-heap via C++ allocations. Default PyArrow max records per batch (spark.sql.execution.arrow.maxRecordsPerBatch = 10000) coupled with large string/array columns exceeds spark.executor.memoryOverhead, triggering CGroup container OOM kills without JVM GC intervention.",
    "bad_code": "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import pandas_udf\nimport pandas as pd\n\nspark = SparkSession.builder \\\n    .appName(\"PyArrowOOMApp\") \\\n    .config(\"spark.executor.memory\", \"4g\") \\\n    .getOrCreate()\n\n@pandas_udf(\"string\")\ndef process_large_text(s: pd.Series) -> pd.Series:\n    return s.str.upper() + \"_PROCESSED_\" + (\"X\" * 1024)\n\n# Unbounded batch size causes PyArrow off-heap buffer to blow up cgroup memory\ndf.withColumn(\"processed\", process_large_text(\"text_col\")).write.mode(\"overwrite\").parquet(\"/tmp/out\")",
    "solution_desc": "Explicitly restrict `spark.sql.execution.arrow.maxRecordsPerBatch` to bound peak off-heap batch buffers, and expand `spark.executor.memoryOverhead` to give C++ allocations sufficient off-heap headroom.",
    "good_code": "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import pandas_udf\nimport pandas as pd\n\nspark = SparkSession.builder \\\n    .appName(\"PyArrowOOMFixed\") \\\n    .config(\"spark.executor.memory\", \"4g\") \\\n    .config(\"spark.executor.memoryOverhead\", \"2g\") \\\n    .config(\"spark.sql.execution.arrow.maxRecordsPerBatch\", \"1000\") \\\n    .config(\"spark.sql.execution.arrow.pyspark.enabled\", \"true\") \\\n    .getOrCreate()\n\n@pandas_udf(\"string\")\ndef process_large_text(s: pd.Series) -> pd.Series:\n    return s.str.upper() + \"_PROCESSED_\" + (\"X\" * 1024)\n\ndf.withColumn(\"processed\", process_large_text(\"text_col\")).write.mode(\"overwrite\").parquet(\"/tmp/out\")",
    "verification": "Monitor node container memory via `dmesg -T | grep -i oom` and inspect Spark UI Executor tab. Verify resident set size (RSS) stays within cgroup limits during high-throughput vectorized transformation stages.",
    "date": "2026-07-31",
    "id": 1785477391,
    "type": "error"
});