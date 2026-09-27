window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Rebalance Storms and Deadlocks",
    "slug": "kafka-consumer-rebalance-storms-heartbeat-deadlocks",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "DistributedSystems",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput Apache Kafka consumers frequently succumb to cascading rebalance storms when individual message batches exceed processing expectations. In standard deployments using the <code>org.apache.kafka.clients.consumer.KafkaConsumer</code> API, heartbeat mechanisms and polling intervals are tightly coupled to message processing unless asynchronous worker delegation is handled correctly.</p><p>When record processing surpasses <code>max.poll.interval.ms</code>, the Kafka broker's Group Coordinator flags the consumer as dead, triggers a cluster-wide rebalance, and reassigns partitions. If the evicted consumer subsequently attempts an offset commit, it encounters a <code>CommitFailedException</code>. As each reassigned consumer inherits the heavy workload, it fails similarly, triggering an unending cycle of consumer group revocation storms.</p>",
    "root_cause": "Blocking the consumer thread with synchronous, long-running batch execution exceeding max.poll.interval.ms, which starves consumer poll calls, causes missed heartbeats, and induces group-wide rebalance cascades.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"analytics-group\");\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"30000\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"telemetry\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy blocking operations inside the poll thread\n        Thread.sleep(5000); \n        processRecord(record);\n    }\n    // Throws CommitFailedException if processing loop took > 30000ms\n    consumer.commitSync(); \n}",
    "solution_desc": "Decouple partition polling from message processing by delegating work to a bounded asynchronous thread pool. Utilize the CooperativeStickyAssignor to prevent stop-the-world revocations across unrelated partitions, and dynamically manage poll pauses using consumer.pause() and consumer.resume() when worker buffers fill up.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"analytics-group\");\nprops.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, \"false\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"100\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nThreadPoolExecutor executor = new ThreadPoolExecutor(8, 8, 0L, TimeUnit.MILLISECONDS,\n    new ArrayBlockingQueue<>(200), new ThreadPoolExecutor.CallerRunsPolicy());\n\nconsumer.subscribe(Collections.singletonList(\"telemetry\"));\n\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(250));\n    if (!records.isEmpty()) {\n        for (ConsumerRecord<String, String> record : records) {\n            executor.submit(() -> processRecord(record));\n        }\n        consumer.commitAsync();\n    }\n}",
    "verification": "Simulate consumer workload spikes and verify via JMX metrics (`records-lag-max`, `rebalance-latency-avg`, `rebalance-rate-per-hour`) that rebalances remain at 0 while consumer instances gracefully process variable-duration payloads.",
    "date": "2026-09-27",
    "id": 1790476460,
    "type": "error"
});