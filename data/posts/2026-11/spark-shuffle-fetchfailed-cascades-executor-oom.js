window.onPostDataLoaded({
    "title": "Resolving Spark FetchFailed Cascades and Executor OOMs",
    "slug": "spark-shuffle-fetchfailed-cascades-executor-oom",
    "language": "Java",
    "code": "FetchFailedException",
    "tags": [
        "Java",
        "Kubernetes",
        "AWS",
        "Big Data",
        "Error Fix"
    ],
    "analysis": "<p>In distributed Apache Spark workloads, a <code>FetchFailedException</code> often triggers a catastrophic failure cascade known as the executor death spiral. When an executor runs out of memory (OOM) due to severe shuffle partition skew or aggressive garbage collection pauses exceeding the heartbeat interval, the cluster manager (YARN or Kubernetes) terminates the container. This drops all shuffle files stored locally on that executor's disk.</p><p>Downstream reduce tasks attempting to fetch intermediate partitions encounter missing blocks, which raises <code>FetchFailedException</code>. Spark's DAG scheduler responds by resubmitting the entire upstream shuffle map stage to regenerate the lost blocks. Because remaining executors must now handle their regular workload plus recomputation, memory pressure intensifies. As more executors fail, stage retries repeat until reaching <code>spark.stage.maxConsecutiveAttempts</code> (default 4), terminating the entire Spark job.</p>",
    "root_cause": "Data skew in join/groupBy keys causing single partitions to exceed memory thresholds, combined with undersized off-heap memory (spark.executor.memoryOverhead) and low network timeout values that treat prolonged GC pauses as node failures.",
    "bad_code": "// Buggy Spark Submission Configuration\nspark-submit \\\n  --master k8s://https://k8s-apiserver:6443 \\\n  --conf spark.executor.instances=50 \\\n  --conf spark.executor.cores=4 \\\n  --conf spark.executor.memory=16g \\\n  --conf spark.executor.memoryOverhead=384m \\\n  --conf spark.sql.shuffle.partitions=200 \\\n  --conf spark.sql.adaptive.enabled=false \\\n  --conf spark.network.timeout=120s \\\n  --class com.example.SkewedJoinJob my-spark-job.jar",
    "solution_desc": "Mitigate the cascade by enabling Adaptive Query Execution (AQE) to dynamically coalesce and split skewed shuffle partitions. Concurrently, increase executor memory overhead to absorb off-heap Netty shuffle buffer spikes, scale up shuffle partition count, decouple shuffle storage via remote shuffle services or node-local External Shuffle Service, and raise fetch retry and timeout thresholds.",
    "good_code": "// Resilient Production Configuration\nspark-submit \\\n  --master k8s://https://k8s-apiserver:6443 \\\n  --conf spark.executor.instances=50 \\\n  --conf spark.executor.cores=4 \\\n  --conf spark.executor.memory=16g \\\n  --conf spark.executor.memoryOverhead=4096m \\\n  --conf spark.sql.adaptive.enabled=true \\\n  --conf spark.sql.adaptive.skewJoin.enabled=true \\\n  --conf spark.sql.adaptive.skewJoin.skewedPartitionFactor=3 \\\n  --conf spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes=268435456 \\\n  --conf spark.sql.adaptive.coalescePartitions.enabled=true \\\n  --conf spark.shuffle.io.maxRetries=10 \\\n  --conf spark.shuffle.io.retryWait=30s \\\n  --conf spark.network.timeout=800s \\\n  --class com.example.SkewedJoinJob my-spark-job.jar",
    "verification": "Monitor the Spark UI 'Stages' tab to confirm zero stage resubmissions and ensure no executors transition to 'Dead' state. Verify in Prometheus/Grafana that JVM GC pause times remain below 5 seconds and shuffle fetch wait times stay within normal operational thresholds.",
    "date": "2026-11-16",
    "id": 1794801466,
    "type": "error"
});