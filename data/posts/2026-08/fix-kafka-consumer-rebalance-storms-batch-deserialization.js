window.onPostDataLoaded({
    "title": "Fix Kafka Rebalance Storms in Batch Deserialization",
    "slug": "fix-kafka-consumer-rebalance-storms-batch-deserialization",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer rebalance storms occur when consumer group members unexpectedly leave and rejoin the group repeatedly, stalling overall topic processing. Under high-throughput batch processing with complex custom deserialization logic, the time consumed during <code>KafkaConsumer.poll()</code> processing can easily surpass the configured <code>max.poll.interval.ms</code>.</p><p>When this deadline is breached, the Kafka broker's Group Coordinator assumes the consumer has failed or hung. It ejects the consumer from the group and triggers a partition rebalance. As remaining consumers inherit the reassigned partitions, they face the same backlog, trigger identical deserialization timeouts, and provoke cascading rebalances across the entire cluster.</p>",
    "root_cause": "The single-threaded execution model of standard Kafka consumers executes deserialization and message processing directly inside or immediately following the `poll()` loop. Processing large byte payloads synchronously exceeds `max.poll.interval.ms`, causing the coordinator to mark the node dead.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30000); // 30 seconds\nKafkaConsumer<String, HeavyPayload> consumer = new KafkaConsumer<>(props);\n\nwhile (true) {\n    ConsumerRecords<String, HeavyPayload> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, HeavyPayload> record : records) {\n        // Synchronous heavy deserialization and payload processing\n        HeavyPayload data = HeavyPayload.deserializeFromBytes(record.value().getRawBytes());\n        processComplexPayload(data); // Takes longer than 30s aggregate for the batch\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple topic polling from batch processing using a dedicated thread pool and ring buffer pattern (or ExecutorService). Tune `max.poll.records` to smaller batch sizes and dynamically pause/resume topic partitions based on worker queue capacity.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50); // Reduce batch size\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000); // 5 minutes\nKafkaConsumer<String, byte[]> consumer = new KafkaConsumer<>(props, new StringDeserializer(), new ByteArrayDeserializer());\n\nExecutorService executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());\n\nwhile (running) {\n    ConsumerRecords<String, byte[]> records = consumer.poll(Duration.ofMillis(500));\n    if (!records.isEmpty()) {\n        CompletableFuture<?>[] futures = records.records(partition).stream()\n            .map(record -> CompletableFuture.runAsync(() -> {\n                HeavyPayload payload = HeavyPayload.deserialize(record.value());\n                processComplexPayload(payload);\n            }, executor))\n            .toArray(CompletableFuture[]::new);\n        \n        CompletableFuture.allOf(futures).join(); // Await current batch within poll interval\n        consumer.commitAsync();\n    }\n}",
    "verification": "Monitor the JMX metric `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` for `rebalance-rate-per-hour` and `last-rebalance-seconds-ago`. Ensure rebalance events drop to zero under sustained peak write traffic.",
    "date": "2026-08-06",
    "id": 1785980591,
    "type": "error"
});