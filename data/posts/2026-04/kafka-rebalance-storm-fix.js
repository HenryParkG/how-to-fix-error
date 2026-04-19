window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storm-fix",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Kafka clusters, a 'Rebalance Storm' occurs when consumers are repeatedly kicked out of the group, causing constant partition reassignment and zero progress. This usually happens when the time taken to process a batch of records exceeds the <code>max.poll.interval.ms</code> configuration.</p><p>When this limit is exceeded, the consumer stops sending heartbeats, the coordinator marks it as dead, and a rebalance is triggered. As other consumers take over the load, they also time out, leading to a cascading failure across the group.</p>",
    "root_cause": "Processing latency per batch exceeds the max.poll.interval.ms threshold, or the heartbeat thread is starved by heavy CPU-bound processing.",
    "bad_code": "properties.put(\"max.poll.records\", \"1000\");\nproperties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// If 1000 records take > 5 mins to process, rebalance occurs.",
    "solution_desc": "Decouple processing from the polling loop using an internal thread pool or significantly reduce 'max.poll.records'. Alternatively, increase 'max.poll.interval.ms' to accommodate the worst-case processing time of a single batch.",
    "good_code": "properties.put(\"max.poll.records\", \"100\"); // Smaller batch\nproperties.put(\"max.poll.interval.ms\", \"600000\"); // 10 mins\nproperties.put(\"session.timeout.ms\", \"45000\");",
    "verification": "Monitor the 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-total' metric. It should stabilize to a near-zero rate after initial startup.",
    "date": "2026-04-19",
    "id": 1776563355,
    "type": "error"
});