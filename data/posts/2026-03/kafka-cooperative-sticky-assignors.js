window.onPostDataLoaded({
    "title": "Resolving Kafka Rebalance Storms with Sticky Assignors",
    "slug": "kafka-cooperative-sticky-assignors",
    "language": "Java",
    "code": "Rebalance Storm",
    "tags": [
        "Java",
        "Backend",
        "Infrastructure",
        "Error Fix"
    ],
    "analysis": "<p>Kafka rebalance storms occur when the consumer group uses the 'Eager' rebalance protocol. In this mode, every consumer in the group must revoke all their partitions before any new assignments are made. This 'stop-the-world' event causes massive processing spikes and latency, especially in large groups where state must be re-initialized from scratch on every partition move.</p>",
    "root_cause": "Usage of default RangeAssignor or RoundRobinAssignor which forces a full revocation of all partitions during every rebalance.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\n// Default assignor causes eager rebalancing\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \"org.apache.kafka.clients.consumer.RangeAssignor\");",
    "solution_desc": "Switch to the CooperativeStickyAssignor. This assignor follows a 'incremental' rebalancing protocol, allowing consumers to keep their currently assigned partitions while only moving the ones that actually need to be shifted.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\n// Enable Cooperative Rebalancing\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");",
    "verification": "Observe the 'rebalance-latency-avg' metric and check logs for 'Revoking all partitions' messages; these should decrease significantly.",
    "date": "2026-03-29",
    "id": 1774776556,
    "type": "error"
});