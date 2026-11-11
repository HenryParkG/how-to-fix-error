window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms & Partition Deadlocks",
    "slug": "kafka-consumer-rebalance-storms-assignment-deadlocks",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Concurrency",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalance storms occur when consumer nodes repeatedly leave and rejoin the group, triggering cascading assignment redistributions. In high-throughput architectures, this often degenerates into a livelock where no partitions process data because the group spends 100% of its time executing partition revocations and joins.</p><p>The default eager rebalance protocol strips all partition assignments across the entire cluster during every change. When records returned from <code>KafkaConsumer.poll()</code> take longer to process than <code>max.poll.interval.ms</code>, the group coordinator assumes the consumer thread is dead, evicts it, and starts a rebalance. When the slow thread finishes and attempts to commit offsets, it encounters <code>CommitFailedException</code>, fails, and rejoins, inducing continuous rebalance cycles.</p>",
    "root_cause": "Processing overhead inside the polling thread exceeds `max.poll.interval.ms`, combined with the legacy Eager Assignment strategy that drops all assignments on any membership change.",
    "bad_code": "KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"telemetry-feed\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> record : records) {\n        // Blocking network RPC inside single-threaded poll loop\n        // Easily exceeds default max.poll.interval.ms (300000ms) under heavy load\n        httpClient.sendPostRequest(record.value()); \n    }\n    consumer.commitSync(); // Throws CommitFailedException after timeout\n}",
    "solution_desc": "Upgrade assignment strategies to `CooperativeStickyAssignor` to allow non-affected partitions to continue processing during reassignments. Offload long-running tasks to an isolated worker thread pool and pause partitions dynamically when the worker queue fills up.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"telemetry-group\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 600000);\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 200);\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nThreadPoolExecutor executor = new ThreadPoolExecutor(8, 8, 0L, \n    TimeUnit.MILLISECONDS, new ArrayBlockingQueue<>(500));\n\nconsumer.subscribe(Collections.singletonList(\"telemetry-feed\"));\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(200));\n    for (ConsumerRecord<String, String> record : records) {\n        executor.submit(() -> processRecord(record));\n    }\n    consumer.commitAsync();\n}",
    "verification": "Inspect JMX metrics for `rebalance-latency-avg` and `rebalance-rate-per-hour` via Prometheus. Confirm `CommitFailedException` rate reaches 0 and partition reassignment time completes without pausing steady consumers.",
    "date": "2026-11-11",
    "id": 1794368968,
    "type": "error"
});