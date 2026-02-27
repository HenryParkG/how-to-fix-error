window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storm-high-cardinality",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in high-cardinality Kafka environments when the time taken to process a batch of records exceeds <code>max.poll.interval.ms</code>. This causes the coordinator to mark the consumer as dead, triggering a rebalance. Because the rebalance itself stops processing, other consumers may also exceed their poll intervals during the reshuffle, leading to a recursive 'storm' where no work is ever completed.</p>",
    "root_cause": "Slow message processing coupled with aggressive session timeouts and high partition counts.",
    "bad_code": "props.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nprops.put(\"max.poll.records\", \"500\"); \n// If 500 records take > 5 mins, rebalance triggers immediately.",
    "solution_desc": "Increase <code>max.poll.interval.ms</code> to provide a larger buffer for processing, and decrease <code>max.poll.records</code> to reduce the unit of work per poll. Additionally, implement 'Static Group Membership' to prevent rebalances on brief restarts.",
    "good_code": "props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\"); // 15 mins\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\");\nprops.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, \"consumer-1-unique-id\");",
    "verification": "Monitor the 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-latency-avg' metric for spikes.",
    "date": "2026-02-27",
    "id": 1772154800,
    "type": "error"
});