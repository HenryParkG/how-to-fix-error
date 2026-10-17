window.onPostDataLoaded({
    "title": "Taming Kafka Consumer Rebalance Storms and Zombie Fencing",
    "slug": "kafka-rebalance-storms-zombie-fencing",
    "language": "Apache Kafka",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Concurrency",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalance storms occur when consumers are repeatedly kicked out of the consumer group, causing partition reassignments across all active group members. Under the legacy eager rebalance protocol, every partition assignment is revoked and paused, devastating end-to-end throughput.</p><p>The primary trigger is consumer poll starvation: when message processing takes longer than <code>max.poll.interval.ms</code>, the group coordinator presumes the consumer is dead and initiates a rebalance. When the evicted consumer finally finishes processing and attempts to commit offsets, it encounters a <code>CommitFailedException</code>. Concurrently, if that evicted consumer continues mutating external state without fencing, it acts as a 'zombie', causing split-brain processing and duplicate executions.</p>",
    "root_cause": "Processing latency per poll batch exceeding max.poll.interval.ms causes the coordinator to drop the consumer. The consumer then triggers cascading rebalances upon attempting to commit offsets, while stale consumers write un-fenced data to downstream sinks.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-group\");\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\n// Default max.poll.interval.ms = 300000 (5 minutes)\n// Processing takes too long per batch:\nConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Synchronous HTTP call or slow database write causes starvation\n        slowThirdPartyApiCall(record.value());\n    }\n    // Throws CommitFailedException if processing > max.poll.interval.ms\n    consumer.commitSync();\n}",
    "solution_desc": "Upgrade to the CooperativeStickyAssignor to avoid global partition revocations (eager protocol). Decouple consumer polling from message processing using a dedicated bounded worker thread pool, tune max.poll.records, and utilize transactional producer IDs for deterministic zombie fencing.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-group\");\n// 1. Cooperative Rebalancing\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\n// 2. Reduce batch size and increase threshold\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"100\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\");\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nExecutorService executor = new ThreadPoolExecutor(\n    8, 8, 0L, TimeUnit.MILLISECONDS, new ArrayBlockingQueue<>(200),\n    new ThreadPoolExecutor.CallerRunsPolicy()\n);\n\nwhile (!Thread.currentThread().isInterrupted()) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    if (!records.isEmpty()) {\n        for (ConsumerRecord<String, String> record : records) {\n            executor.submit(() -> processRecord(record));\n        }\n        consumer.commitSync();\n    }\n}",
    "verification": "Monitor JMX consumer group metrics: `rebalance-rate-per-hour` should stabilize near zero during normal operations, and verify zero occurrences of `CommitFailedException` or `RevocationException` in service logs.",
    "date": "2026-10-17",
    "id": 1792203051,
    "type": "error"
});