window.onPostDataLoaded({
    "title": "Fix Kafka Heartbeat Starvation & Rebalance Storms",
    "slug": "fix-kafka-heartbeat-starvation-rebalance-storms",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer rebalance storms occur when consumer instances are evicted from the consumer group unexpectedly, triggering partition reassignments across all surviving consumers. In high-throughput or batch-processing architectures, this is frequently caused by heartbeat starvation.</p><p>When a consumer thread spends too much time processing a batch returned by <code>poll()</code>, it exceeds <code>max.poll.interval.ms</code>. The group coordinator marks the consumer dead, initiates a rebalance, and revokes its partitions. When the evicted consumer finishes processing and attempts to commit offsets, it throws a <code>CommitFailedException</code>, and re-joining attempts cascade into continuous rebalancing loops.</p>",
    "root_cause": "Synchronous, long-running record processing inside the polling loop blocks the background heartbeat mechanism or exceeds the max.poll.interval.ms threshold, causing coordinator timeouts.",
    "bad_code": "KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Blocking synchronous processing (e.g. external REST/DB call)\n        processOrderWithExternalHttpService(record.value()); // Takes ~500ms per record\n    }\n    consumer.commitSync(); // Fails with CommitFailedException if batch * 500ms > max.poll.interval.ms\n}",
    "solution_desc": "Decouple message polling from processing using an asynchronous worker pool or reactive pipeline. Lower `max.poll.records` to ensure batches finish within `max.poll.interval.ms`, and properly handle partition pause/resume when downstream queues fill up.",
    "good_code": "KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\nExecutorService workerPool = Executors.newFixedThreadPool(16);\n\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");\n\nwhile (isRunning) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    if (!records.isEmpty()) {\n        List<Future<?>> futures = new ArrayList<>();\n        for (ConsumerRecord<String, String> record : records) {\n            futures.add(workerPool.submit(() -> processOrder(record.value())));\n        }\n        for (Future<?> future : futures) {\n            future.get(4, TimeUnit.MINUTES); // Bound processing within poll interval\n        }\n        consumer.commitAsync();\n    }\n}",
    "verification": "Monitor the consumer group lag and rebalance metrics using `kafka-consumer-groups.sh --describe --group order-group`. Ensure `join-rate`, `rebalance-rate`, and `rebalance-latency-avg` remain near zero during sustained load.",
    "date": "2026-08-22",
    "id": 1787379792,
    "type": "error"
});