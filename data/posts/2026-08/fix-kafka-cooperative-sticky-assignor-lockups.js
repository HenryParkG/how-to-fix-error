window.onPostDataLoaded({
    "title": "Fix Kafka Cooperative Sticky Assignor Lockups",
    "slug": "fix-kafka-cooperative-sticky-assignor-lockups",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>When operating large-scale Apache Kafka consumer groups subject to rapid rebalance cascades (such as during Kubernetes deployment rollouts or dynamic node scaling), consumers using the <code>CooperativeStickyAssignor</code> can become stuck in perpetual rebalancing loops or thread lockups. Consumers repeatedly log <code>CommitFailedException</code> and partition revocation timeouts, bringing message consumption to a total standstill across the consumer group.</p>",
    "root_cause": "The CooperativeStickyAssignor uses a two-phase protocol to minimize partition downtime. However, if long-running synchronous partition revocation callbacks block the consumer main thread beyond `max.poll.interval.ms`, the GroupCoordinator drops the member. Upon rejoined rebalances, mismatched generation IDs prevent revoked partitions from being reassigned, locking partition assignment state indefinitely.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processor\");\n// BAD: Standard cooperative assignor with low poll interval and blocking listener\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"5000\"); // Too short for heavy revocation\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // BAD: Synchronously committing DB transactions inside revocation callback!\n        flushDatabaseBufferBlocking(partitions);\n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {}\n});",
    "solution_desc": "Decouple buffer flushing from the rebalance event thread, increase `max.poll.interval.ms`, configure `session.timeout.ms` appropriately, and enforce non-blocking partition revocation handling using a dedicated executor channel or graceful bounded flushing.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processor\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n// GOOD: Increased poll interval to prevent coordinator eviction during rebalances\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");\nprops.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // GOOD: Non-blocking or timed bounded flush\n        asyncPreparePartitionRevocation(partitions);\n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {\n        logger.info(\"Assigned partitions safely: {}\", partitions);\n    }\n});",
    "verification": "Perform rolling restarts of consumer pods under high ingress traffic load. Monitor Kafka consumer metrics (`rebalance-latency-avg`, `rebalance-rate-per-hour`). Confirm zero `CommitFailedException` occurrences and normal partition reassignment stability within < 2 seconds per cycle.",
    "date": "2026-08-01",
    "id": 1785549347,
    "type": "error"
});