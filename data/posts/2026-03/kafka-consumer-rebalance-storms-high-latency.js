window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms-high-latency",
    "language": "Java",
    "code": "ConsumerRebalanceException",
    "tags": [
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-latency clusters, 'Rebalance Storms' occur when heartbeat signals fail to reach the coordinator within the <code>session.timeout.ms</code> window. This triggers a group rebalance, stopping all consumers. As consumers rejoin, they often fail again due to the overhead of the rebalance process itself, creating a catastrophic feedback loop that halts message processing.</p>",
    "root_cause": "Aggressive heartbeat timeouts combined with network jitter and the 'Eager Rebalance' protocol which revokes all partitions before reassigning them.",
    "bad_code": "properties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"10000\");\nproperties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, \"3000\");\nproperties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, RangeAssignor.class.getName());",
    "solution_desc": "Increase timeouts to accommodate latency spikes and switch to the 'Cooperative Sticky' assignor. This allows consumers to keep their partitions during a rebalance, only revoking what is necessary, thus preventing the 'stop-the-world' effect.",
    "good_code": "properties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\nproperties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, \"15000\");\nproperties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency-avg' metrics in JMX; stable clusters should show minimal join events during network jitter.",
    "date": "2026-03-07",
    "id": 1772864959,
    "type": "error"
});