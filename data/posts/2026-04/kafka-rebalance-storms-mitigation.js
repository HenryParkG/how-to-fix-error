window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storms-mitigation",
    "language": "Java",
    "code": "REBALANCE_STORM",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in high-throughput streams when consumers are evicted from the group, triggering a cascade of partition re-assignments. This usually happens because processing a single batch takes longer than the max.poll.interval.ms, causing the broker to think the consumer has died, which subsequently forces other consumers to stop and re-sync.</p>",
    "root_cause": "Processing time exceeding max.poll.interval.ms combined with dynamic group membership causing 'Stop-the-World' pauses.",
    "bad_code": "// Consumer Configuration\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nprops.put(\"enable.auto.commit\", \"true\");\n// Processing logic is too slow for 5 mins\nconsumer.poll(Duration.ofMillis(100)).forEach(record -> {\n    heavyDatabaseIntegration(record); \n});",
    "solution_desc": "Implement Static Group Membership by setting group.instance.id to prevent rebalances on pod restarts, and switch to the CooperativeStickyAssignor to allow incremental rebalancing.",
    "good_code": "// Optimized Configuration\nprops.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, \"node-1\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\");",
    "verification": "Monitor JMX metrics for 'join-rate' and 'rebalance-latency-avg'; values should stabilize even during consumer restarts.",
    "date": "2026-04-22",
    "id": 1776821431,
    "type": "error"
});