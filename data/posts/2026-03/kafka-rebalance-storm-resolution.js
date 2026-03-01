window.onPostDataLoaded({
    "title": "Resolving Kafka Rebalance Storms in High-Partition Clusters",
    "slug": "kafka-rebalance-storm-resolution",
    "language": "Java",
    "code": "RebalanceInProgress",
    "tags": [
        "Kafka",
        "Backend",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In clusters with thousands of partitions, a single slow consumer can trigger a 'rebalance storm.' This occurs when a consumer fails to send a heartbeat within the <code>session.timeout.ms</code>, or takes longer than <code>max.poll.interval.ms</code> to process a batch. The coordinator triggers a rebalance, causing all consumers to stop, which increases the lag further and leads to a cascading cycle of rebalances across the group.</p>",
    "root_cause": "Aggressive session timeouts combined with heavy processing loads and high partition counts, causing metadata overhead to exceed the rebalance window.",
    "bad_code": "properties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"10000\");\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");\n// Processing logic takes > 5 minutes",
    "solution_desc": "Implement Static Group Membership to avoid rebalances on transient restarts and decouple the processing logic from the heartbeat thread. Increase max.poll.interval.ms to accommodate peak processing times.",
    "good_code": "properties.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, \"consumer-node-1\");\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\");\n// Use internal thread pool to process data while the poll loop remains active",
    "verification": "Check Kafka broker logs for 'Group rebalancing' frequency. Use JMX metrics to monitor 'join-rate' and 'sync-rate'.",
    "date": "2026-03-01",
    "id": 1772346938,
    "type": "error"
});