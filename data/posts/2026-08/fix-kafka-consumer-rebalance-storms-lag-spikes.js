window.onPostDataLoaded({
    "title": "Resolve Kafka Rebalance Storms and Lag Spikes",
    "slug": "fix-kafka-consumer-rebalance-storms-lag-spikes",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalance storms occur when batch processing times exceed <code>max.poll.interval.ms</code>. The Kafka broker's group coordinator assumes the consumer instance is dead, revokes its partitions, and triggers a cluster-wide rebalance. When multiple consumers repeatedly hit this timeout during traffic bursts, consumers continuously join and leave the group, dropping throughput to near zero and triggering massive partition lag spikes.</p>",
    "root_cause": "Synchronous, long-running business logic inside the poll loop exceeding max.poll.interval.ms, paired with the legacy Eager Rebalance protocol that revokes all partitions during assignment changes.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);\n// Default max.poll.interval.ms is 300000 (5 mins)\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy blocking processing (e.g., 2 seconds per record * 500 records = 1000s > 300s timeout)\n        processRemoteOrder(record.value());\n    }\n    consumer.commitSync(); // Throws CommitFailedException\n}",
    "solution_desc": "Adopt the Cooperative Sticky partition assignor to eliminate 'stop-the-world' rebalances. Lower max.poll.records, increase max.poll.interval.ms, or delegate heavy record processing to an internal thread pool with bounded queues.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\n// 1. Cooperative sticky assignor prevents full group pause\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,\n    \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\n// 2. Bound poll batch size to match processing capacity\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 600000); // 10 mins\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> record : records) {\n        processOrderFast(record.value());\n    }\n    consumer.commitAsync();\n}",
    "verification": "Inspect JMX metrics 'consumer-coordinator-metrics:rebalance-latency-avg' and 'consumer-fetch-manager-metrics:records-lag-max' to ensure rebalance counts remain near zero during high ingestion.",
    "date": "2026-08-30",
    "id": 1788057179,
    "type": "error"
});