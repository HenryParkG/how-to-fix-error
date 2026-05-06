window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Failures on Spot Instances",
    "slug": "spark-shuffle-block-migration-spot-instances",
    "language": "Java",
    "code": "ShuffleFetchFailed",
    "tags": [
        "Java",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Running Apache Spark on ephemeral Spot Instances is cost-effective but prone to ShuffleFetchFailed errors. When an AWS Spot Instance receives a termination notice, Spark must migrate its local shuffle blocks to a surviving node. If the migration isn't finished before the 2-minute notice expires, the data is lost.</p><p>Standard Spark configurations often fail to trigger decommissioning quickly enough, or they attempt to fetch blocks from executors that have already been terminated, leading to job restarts and expensive re-computation.</p>",
    "root_cause": "Executor termination occurring before shuffle block migration completes, exacerbated by inactive 'spark.decommission.enabled' settings.",
    "bad_code": "# Default configuration often lacks proactive decommissioning\nspark-submit --conf spark.dynamicAllocation.enabled=true \\\n             --conf spark.shuffle.service.enabled=true \\\n             --class com.example.MyJob my-spark-app.jar",
    "solution_desc": "Enable Spark's decommissioning framework. Configure 'spark.decommission.enabled' and 'spark.storage.decommission.shuffleBlocks.enabled'. This allows Spark to proactively move shuffle data to other executors as soon as the spot interruption signal is detected via the node termination handler.",
    "good_code": "spark-submit \\\n  --conf spark.decommission.enabled=true \\\n  --conf spark.storage.decommission.enabled=true \\\n  --conf spark.storage.decommission.shuffleBlocks.enabled=true \\\n  --conf spark.storage.decommission.rddBlocks.enabled=true \\\n  --conf spark.scheduler.executor.decommission.initialWaitThreadDelay=30s \\\n  --class com.example.MyJob my-spark-app.jar",
    "verification": "Check the Spark UI 'Executors' tab during a spot termination event. Look for the 'Decommissioned' status and verify that 'Shuffle Blocks Migrated' count is greater than zero.",
    "date": "2026-05-06",
    "id": 1778046568,
    "type": "error"
});