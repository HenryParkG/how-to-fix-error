window.onPostDataLoaded({
    "title": "Resolving Spark Shuffle Loss on Spot Instances",
    "slug": "spark-shuffle-block-loss-spot-instances",
    "language": "Java",
    "code": "FetchFailedException",
    "tags": [
        "Java",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When running Apache Spark on AWS Spot Instances, nodes can be reclaimed with a 2-minute warning. If a node acting as a shuffle server is terminated, all intermediate shuffle data stored on its local disk is lost.</p><p>Downstream stages attempting to fetch this data will encounter 'FetchFailedException', forcing Spark to re-compute the entire lineage of the lost data, significantly degrading performance or causing job failure.</p>",
    "root_cause": "Spark's default behavior does not proactively migrate shuffle blocks or metadata when a decommissioning signal is received from the cloud provider.",
    "bad_code": "// Standard configuration lacking decommission awareness\nspark-submit --master yarn \\\n  --conf spark.dynamicAllocation.enabled=true \\\n  --executor-cores 4 \\\n  my-spark-job.jar",
    "solution_desc": "Enable Spark's decommissioning framework. This allows executors to stop taking new tasks and attempt to migrate shuffle blocks to peers before the instance is fully terminated.",
    "good_code": "// Resilient Spot Configuration\nspark-submit --master yarn \\\n  --conf spark.decommission.enabled=true \\\n  --conf spark.storage.decommission.enabled=true \\\n  --conf spark.storage.decommission.shuffleBlocks.enabled=true \\\n  --conf spark.storage.decommission.replication.maxReplicationFailures=3 \\\n  --conf spark.scheduler.executorDecommissionSig=SIGTERM \\\n  my-spark-job.jar",
    "verification": "Review Spark Driver logs for 'Executor decommissioned' messages and verify that shuffle fetch retries are minimized during spot interruptions.",
    "date": "2026-04-11",
    "id": 1775890284,
    "type": "error"
});