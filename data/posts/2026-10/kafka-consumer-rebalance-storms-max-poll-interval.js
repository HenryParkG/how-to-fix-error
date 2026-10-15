window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storm Cascades",
    "slug": "kafka-consumer-rebalance-storms-max-poll-interval",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer rebalance storms occur when consumers are repeatedly evicted from their consumer group, triggering stop-the-world partition reassignments across all surviving nodes. A frequent cause is message batch processing latency exceeding <code>max.poll.interval.ms</code>. When an application fetches a large batch using <code>poll()</code> and executes long-running synchronous business logic or blocked database I/O, the background heartbeat thread cannot mask the delay; Kafka considers the consumer dead if the next <code>poll()</code> call does not arrive within the configured window.</p><p>When the coordinator marks the consumer dead, it revokes partitions and initiates a group rebalance. When the consumer finally finishes its batch and attempts to commit offsets, it encounters an unrecoverable <code>CommitFailedException</code>. As the failed consumer rejoins, it restarts a new rebalance cycle, propagating cascading latencies and duplicate message consumption across the entire cluster.</p>",
    "root_cause": "The consumer poll loop blocks longer than `max.poll.interval.ms` while processing records synchronously, causing consumer group coordinators to eject the client and trigger cascading rebalance events.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 1000); // Too high for slow work\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 60000);\n\nKafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, OrderEvent> record : records) {\n        // Synchronous I/O: 1000 records * 150ms = 150 seconds (> 60s max.poll.interval.ms)\n        processDatabaseTransaction(record.value());\n    }\n    consumer.commitSync(); // Throws CommitFailedException\n}",
    "solution_desc": "Decouple Kafka consumption from record processing using an internal bounded queue and worker pool, or size `max.poll.records` strictly relative to worst-case task processing time. Additionally, switch to Kafka's `CooperativeStickyAssignor` to allow non-revoked partitions to continue processing during unavoidable rebalances.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\n// Restrict batch size and increase interval threshold\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000); // 5 minutes\n// Enable incremental cooperative rebalancing\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    Collections.singletonList(CooperativeStickyAssignor.class.getName()));\n\nKafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (running) {\n    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(250));\n    if (!records.isEmpty()) {\n        processBatchWithTimeout(records, Duration.ofSeconds(180));\n        consumer.commitAsync();\n    }\n}",
    "verification": "Monitor Kafka consumer group states via `kafka-consumer-groups.sh --describe` and monitor JMX metrics `rebalance-rate-per-hour` and `rebalance-latency-avg`. Confirm rebalance rates drop to near-zero during standard peak loads.",
    "date": "2026-10-15",
    "id": 1792031083,
    "type": "error"
});