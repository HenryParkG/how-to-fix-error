window.onPostDataLoaded({
    "title": "Debugging Kafka Rebalance Storms & Heartbeats",
    "slug": "kafka-consumer-rebalance-storm-heartbeat-timeout",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>A Kafka consumer group rebalance storm occurs when consumer nodes repeatedly get evicted from the cluster group coordinator, triggering non-stop partition reassignment cycles. During an active rebalance, partition consumption halts, generating cascading backpressure across event pipelines. The two primary mechanisms triggering unexpected consumer eviction are exceeding <code>max.poll.interval.ms</code> during lengthy synchronous batch processing and heartbeat thread starvation caused by excessive JVM Garbage Collection (GC) pauses or thread pool saturation.</p>",
    "root_cause": "Synchronous, long-running database or third-party HTTP processing inside the poll loop exceeds `max.poll.interval.ms`, causing the Kafka group coordinator to assume the consumer has died, revoke its partitions, and initiate an eviction cascade.",
    "bad_code": "KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"order-events\"));\n\nwhile (true) {\n    // Polling default 500 records\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Synchronous HTTP or DB call taking up to 800ms per record\n        // 500 * 800ms = 400s >> default max.poll.interval.ms (300s)\n        processOrderThroughPaymentGateway(record.value());\n    }\n    // Throws CommitFailedException because group coordinator revoked partition\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple partition polling from message processing by sizing `max.poll.records` accurately according to maximum processing latency, or offload batch handling to an asynchronous executor thread pool. Upgrade to the `CooperativeStickyAssignor` partition assignor to replace eager stop-the-world rebalances with incremental, non-disruptive migrations.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\"); // Reduce batch size\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\"); // 10 minutes max\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"order-events\"));\n\nwhile (isRunning) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    if (!records.isEmpty()) {\n        processBatchWithBoundedTimeouts(records);\n        consumer.commitSync();\n    }\n}",
    "verification": "Monitor JMX metrics `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` for `rebalance-rate-per-hour` and `rebalance-latency-avg`. Confirm that consumer group rebalance frequency settles to zero during continuous peak traffic.",
    "date": "2026-11-08",
    "id": 1794108544,
    "type": "error"
});