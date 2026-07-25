window.onPostDataLoaded({
    "title": "Fixing Kafka Cooperative Sticky Assignor State Desync",
    "slug": "fixing-kafka-cooperative-sticky-assignor-state-desync",
    "language": "Java",
    "code": "StateDesync",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When transitioning Apache Kafka consumer groups from eager partition assignors to the <code>CooperativeStickyAssignor</code>, consumers may encounter state desynchronization during rolling deployments. This occurs when consumers in the group run mismatched assignment strategies or when legacy <code>ConsumerRebalanceListener</code> callbacks manually unassign partitions, leading to stuck consumer groups or duplicate partition assignments.</p>",
    "root_cause": "Combining dynamic topic metadata changes with non-cooperative custom rebalance listeners forces fallback eager rebalances, confusing the incremental assignment state machine and causing active consumers to hang waiting for unreleased partitions.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processors\");\n// BAD: Mixing Cooperative assignor while relying on eager revoker logic\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Pattern.compile(\"orders-.*\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // BAD: Blocking commit during incremental revokes creates state desync\n        consumer.commitSync();\n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {}\n});",
    "solution_desc": "Configure dynamic consumer groups using a staged assignment strategy list allowing smooth fallback, and update `ConsumerRebalanceListener` to asynchronously handle revoked partitions without blocking incremental partition re-assignments.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processors\");\n// Set cooperative assignor with smooth migration fallback\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    Arrays.asList(CooperativeStickyAssignor.class.getName(), StickyAssignor.class.getName()));\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // Correct: Non-blocking offset commitment for revoked subset only\n        consumer.commitAsync(currentOffsets, null);\n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {\n        // Resume fetch for newly assigned partitions incrementally\n    }\n});",
    "verification": "Monitor the consumer group using `kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group order-processors` during a rolling restart and confirm state transition stays in `Stable` without persistent `PreparingRebalance` lockups.",
    "date": "2026-07-25",
    "id": 1784965883,
    "type": "error"
});