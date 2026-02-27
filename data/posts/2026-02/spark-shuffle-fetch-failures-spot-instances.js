window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Block Fetch Failures on Spot Instances",
    "slug": "spark-shuffle-fetch-failures-spot-instances",
    "language": "Java",
    "code": "FetchFailedException",
    "tags": [
        "Java",
        "AWS",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Apache Spark clusters running on AWS Spot Instances, 'FetchFailedException' is a common nightmare. When a Spot Instance is reclaimed, the executor running on it is terminated. If that executor was hosting shuffle files for downstream stages, those blocks become unreachable. While Spark attempts to re-compute the missing shuffle data, aggressive reclamation leads to 'Stage failures' and job termination if the shuffle service cannot be reached or the metadata for the block is lost.</p>",
    "root_cause": "Loss of the External Shuffle Service (ESS) node or the local disk containing shuffle data during a Spot termination before the consumer (Reducer) can fetch the blocks.",
    "bad_code": "spark.shuffle.service.enabled: true\nspark.dynamicAllocation.enabled: true\n# Default retry settings often fail on high-latency Spot reclaims\nspark.shuffle.io.maxRetries: 3\nspark.shuffle.io.retryWait: 5s",
    "solution_desc": "Implement a Remote Shuffle Service (RSS) like Celeborn or Uniffle to decouple shuffle storage from compute nodes. Alternatively, configure Spark to be 'decommissioning-aware' so it proactively migrates shuffle blocks when a Spot termination notice is received via the Metadata Service.",
    "good_code": "spark.decommission.enabled: true\nspark.storage.decommission.enabled: true\nspark.storage.decommission.shuffleBlocks.enabled: true\nspark.shuffle.io.maxRetries: 10\nspark.shuffle.io.retryWait: 15s\n# Use S3 for shuffle if performance permits (Cloud Shuffle Storage)\nspark.shuffle.manager: org.apache.spark.shuffle.sort.SortShuffleManager",
    "verification": "Monitor Spark UI for 'Fetch Failed' events and verify that the 'Decommissioning' status appears in logs before executor exit.",
    "date": "2026-02-27",
    "id": 1772184796,
    "type": "error"
});