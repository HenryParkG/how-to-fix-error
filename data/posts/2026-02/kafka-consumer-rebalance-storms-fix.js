window.onPostDataLoaded({
    "title": "Kafka: Fixing Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms-fix",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in Kafka clusters with high partition counts when the group coordinator triggers frequent reassignments. This typically happens because a consumer takes too long to process a batch, exceeding the <code>max.poll.interval.ms</code>, or due to network flakiness exceeding <code>session.timeout.ms</code>. In 'Eager' rebalancing, the entire group stops processing, leading to massive latency spikes and cascading failures as the 'stop-the-world' effect prevents heartbeat signals from being sent.</p>",
    "root_cause": "The default Eager Rebalance protocol requires all consumers to revoke their partitions before any can be reassigned, combined with aggressive timeout settings in high-latency environments.",
    "bad_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, RangeAssignor.class.getName());\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 mins too short for heavy tasks",
    "solution_desc": "Switch to the Cooperative Sticky Assignor to allow 'Incremental Cooperative Rebalancing'. This allows consumers to keep their partitions during a rebalance if they aren't being moved. Additionally, increase the poll interval to account for worst-case processing times and tune heartbeat settings to distinguish between application lag and network failure.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\"); // 15 mins\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency-avg' metrics in JMX; rebalance times should drop from seconds to milliseconds.",
    "date": "2026-02-16",
    "id": 1771224885,
    "type": "error"
});