window.onPostDataLoaded({
    "title": "Kafka Rebalance Storms & Heartbeat Starvation",
    "slug": "kafka-consumer-rebalance-heartbeat-starvation",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Kafka, consumer group liveness is tracked through two distinct mechanisms: background heartbeats sent via the heartbeat thread to the group coordinator (tracked by <code>session.timeout.ms</code>), and active processing liveness managed by sequential invocations of <code>poll()</code> (tracked by <code>max.poll.interval.ms</code>).</p><p>Heartbeat starvation and cascading rebalances occur when record batch processing time inside consumer worker logic exceeds <code>max.poll.interval.ms</code>. The coordinator considers the consumer dead, removes it from the group, revokes its partition assignments, and triggers an 'eager' stop-the-world rebalance. When the evicted consumer finishes processing and attempts to commit offsets, it throws <code>CommitFailedException</code>, fails to join the group in time, and triggers repetitive cyclic rebalances across the entire cluster.</p>",
    "root_cause": "Synchronous, long-running record processing inside the main consumer thread causes poll() call delays beyond 'max.poll.interval.ms', combined with eager rebalance partition assignors triggering group-wide stalls.",
    "bad_code": "// Synchronous processing loop prone to heartbeat starvation\nProperties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processor\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"5000\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 minutes\nKafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);\n\nwhile (running) {\n    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, OrderEvent> record : records) {\n        // Blocking external RPC call (takes 100ms * 5000 records = 500s > 300s limit!)\n        callPaymentGateway(record.value()); \n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Switch partition assignment to CooperativeStickyAssignor to prevent stop-the-world revocations. Calibrate max.poll.records to keep batch latency strictly below max.poll.interval.ms, or offload processing to bounded asynchronous worker queues.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processor\");\n// 1. Adopt Incremental Cooperative Rebalancing\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\n// 2. Reduce batch size to bound worst-case processing duration\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"100\");\n// 3. Set max.poll.interval.ms conservatively higher than worst batch latency\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\"); // 10 minutes\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\n\nKafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (running) {\n    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(250));\n    if (!records.isEmpty()) {\n        processBatchConcurrently(records); // Dispatched across bounded worker pool\n        consumer.commitAsync();\n    }\n}",
    "verification": "Monitor JMX metrics 'consumer-coordinator-metrics:rebalance-latency-avg' and 'rebalance-total'. Verify that rebalances complete incrementally without CommitFailedException and partition revocation count drops near zero during rolling deployments.",
    "date": "2026-11-05",
    "id": 1793852403,
    "type": "error"
});