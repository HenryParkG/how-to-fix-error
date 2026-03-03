window.onPostDataLoaded({
    "title": "Resolving Kafka Stop-the-World Rebalancing",
    "slug": "kafka-stop-the-world-rebalancing-fix",
    "language": "Java",
    "code": "ConsumerRebalanceDelay",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In Kafka clusters with high partition counts, the default 'Eager Rebalancing' protocol causes 'Stop-the-World' events. When a single consumer joins or leaves, all consumers in the group must stop processing, revoke their partitions, and wait for a new assignment.</p><p>For clusters with thousands of partitions, this synchronization phase can take minutes, leading to massive lag spikes and downstream service degradation as the group remains idle during the reshuffle.</p>",
    "root_cause": "The use of `RangeAssignor` or `RoundRobinAssignor` which requires a full group synchronization and partition revocation cycle.",
    "bad_code": "properties.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-group\");\n// Default assignment strategy is used (Eager)\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);",
    "solution_desc": "Switch the partition assignment strategy to `CooperativeStickyAssignor`. This enables Incremental Cooperative Rebalancing, allowing consumers to keep their partitions while the group rebalances.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    Collections.singletonList(CooperativeStickyAssignor.class.getName()));\nproperties.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-group\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);",
    "verification": "Check Kafka logs for 'Incremental rebalance completed' and ensure consumer lag does not spike globally during pod restarts.",
    "date": "2026-03-03",
    "id": 1772500728,
    "type": "error"
});