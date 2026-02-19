window.onPostDataLoaded({
    "title": "Fixing Kafka Sticky Assignor Partition Imbalance",
    "slug": "kafka-sticky-assignor-imbalance-fix",
    "language": "Java",
    "code": "ConsumerImbalance",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>The StickyAssignor in Kafka is designed to preserve partition-to-consumer mappings to minimize overhead during rebalances. However, a known issue occurs during rapid scaling or rolling restarts where certain consumers become 'greedy,' holding onto old partitions while others remain idle, leading to severe throughput skew.</p>",
    "root_cause": "The original StickyAssignor lacks global knowledge during incremental updates, causing it to prioritize 'stickiness' over 'balance' when generation IDs are incremented rapidly without full state reconciliation.",
    "bad_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    StickyAssignor.class.getName());",
    "solution_desc": "Upgrade to the 'CooperativeStickyAssignor'. Unlike the eager StickyAssignor, the cooperative version supports incremental rebalancing, allowing consumers to keep their partitions during the rebalance process while gradually shifting them to achieve global balance without a 'stop-the-world' event.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");",
    "verification": "Monitor the 'records-lag-max' and 'assigned-partitions' metrics via JMX. After a rebalance, the distribution should converge to a mean variance of < 1 partition.",
    "date": "2026-02-19",
    "id": 1771493861,
    "type": "error"
});