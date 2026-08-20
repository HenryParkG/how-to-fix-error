window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms & Heartbeat Deadlocks",
    "slug": "kafka-consumer-rebalance-storm-heartbeat-deadlock",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Java",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Apache Kafka deployments, consumer groups can enter catastrophic rebalance storms when message processing latency exceeds <code>max.poll.interval.ms</code>. When a single consumer thread blocks on an external dependency (such as a database or downstream HTTP service) during record processing, it fails to invoke <code>poll()</code> in time.</p><p>The Kafka coordinator marks the consumer dead and triggers a consumer group rebalance. This rebalance revokes assigned partitions and redistributes them across surviving consumers, increasing their workload. The resulting cascade causes subsequent consumers to exceed their polling timeouts as well, locking the cluster in a perpetual rebalance loop.</p>",
    "root_cause": "Synchronous, long-running message processing on the Kafka consumer polling thread violates max.poll.interval.ms, causing coordinator-evicted consumers and cascading rebalance loops.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30000); // 30s\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> record : records) {\n        // Synchronous blocking call with unbounded execution time\n        externalPaymentGateway.processPayment(record.value());\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple message polling from record processing by using a bounded worker pool and pause/resume mechanics, or adjust max.poll.records alongside max.poll.interval.ms and utilize cooperative sticky rebalancing (CooperativeStickyAssignor) to prevent global stop-the-world partition revocations.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000); // 5 min\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n          CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\nExecutorService workers = new ThreadPoolExecutor(8, 8, 0L, TimeUnit.MILLISECONDS, new ArrayBlockingQueue<>(100));\n\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(200));\n    for (ConsumerRecord<String, String> record : records) {\n        workers.submit(() -> processRecordWithTimeout(record));\n    }\n    consumer.commitAsync();\n}",
    "verification": "Monitor JMX metrics `kafka.consumer:type=consumer-coordinator-metrics,client-id=*,name=rebalance-rate-per-hour` and verify that `join-time-avg` stabilizes near zero without repeated partition revocations under peak load.",
    "date": "2026-08-20",
    "id": 1787218008,
    "type": "error"
});