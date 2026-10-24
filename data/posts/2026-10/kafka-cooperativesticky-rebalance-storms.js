window.onPostDataLoaded({
    "title": "Fix Kafka CooperativeSticky Rebalance Storms",
    "slug": "kafka-cooperativesticky-rebalance-storms",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Java",
        "Kafka",
        "DistributedSystems",
        "Error Fix"
    ],
    "analysis": "<p>The <code>CooperativeStickyAssignor</code> was introduced to replace eager rebalances with an incremental, non-blocking protocol. Instead of revoking all partitions simultaneously, it allows consumers to continue processing unaffected partitions while reassigned partitions migrate in phases.</p><p>Despite this advantage, consumer groups can enter catastrophic rebalance storms when consumers run long-running batch processing. If execution time exceeds <code>max.poll.interval.ms</code> during the reassignment phase, or if partition revocation callbacks trigger synchronous, blocking offset commits that exceed timeouts, the broker marks the consumer failed. The subsequent immediate rejoin invalidates the cooperative assignment state machine, forcing repetitive rollback and sync cycles across all members.</p>",
    "root_cause": "Long-running poll processing exceeding max.poll.interval.ms during partition revocation callbacks causes members to fall out of the group midway through the two-phase cooperative reassignment protocol.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 15000); // Dangerously short for heavy processing\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);\n\nKafkaConsumer<String, byte[]> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"telemetry\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // Synchronous commit blocks during rebalance handshake\n        consumer.commitSync(); \n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {}\n});",
    "solution_desc": "Decouple partition commit logic inside onPartitionsRevoked using bounded asynchronous commits, lower max.poll.records to ensure poll loops complete well under max.poll.interval.ms, and configure heartbeats appropriately.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000); // 5 minutes\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);        // Keep batch sizes predictable\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);\n\nKafkaConsumer<String, byte[]> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"telemetry\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // Non-blocking async commit with fallback to prevent rebalance timeouts\n        consumer.commitAsync((offsets, exception) -> {\n            if (exception != null) {\n                log.warn(\"Offset commit failed during partition revocation\", exception);\n            }\n        });\n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {}\n});",
    "verification": "Monitor JMX metrics 'rebalance-latency-avg' and 'rebalance-rate-per-hour'. Check Kafka broker logs to ensure 'PreparingRebalance' messages no longer loop continually during peak consumption.",
    "date": "2026-10-24",
    "id": 1792809356,
    "type": "error"
});