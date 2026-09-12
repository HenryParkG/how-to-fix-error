window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Rebalance Storms & Starvation",
    "slug": "kafka-consumer-rebalance-heartbeat-starvation",
    "language": "Apache Kafka",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Apache Kafka consumer groups can degrade into cyclic rebalance storms when individual consumers fail to send heartbeats or fail to poll within configured timeouts. Even though the modern Kafka consumer client runs heartbeats on a dedicated background thread, message processing that exceeds <code>max.poll.interval.ms</code> forces the broker coordinator to declare the consumer dead.</p><p>When a dead consumer is kicked out, partition assignment resets across all group members. The displaced consumers re-join, taking CPU cycles to re-initialize state and fetch from offset commits. If processing continues to stall across consumer instances, the cluster enters an unrecoverable rebalance cascade where no messages are finalized.</p>",
    "root_cause": "Synchronous record processing inside the polling loop exceeds `max.poll.interval.ms`, causing consumer group eviction despite active background heartbeats, followed by eager partition reassignment storms.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"order-processing-group\");\nprops.put(\"enable.auto.commit\", \"false\");\nprops.put(\"max.poll.records\", \"500\"); // High batch count\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 minutes\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Blocking RPC or intensive processing that takes 1-2 seconds per record\n        executeHeavyTransaction(record.value());\n    }\n    consumer.commitSync(); // Fails with CommitFailedException after coordinator eviction\n}",
    "solution_desc": "Transition to the `CooperativeStickyAssignor` to enable cooperative, incremental rebalancing. Calibrate `max.poll.records` downward to match throughput capacity, and decouple the polling loop from heavy tasks using an asynchronous worker pool or reactive flow control with partition pausing.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\"); // Smaller manageable batches\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\"); // 10 minutes budget\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(List.of(\"orders\"));\nExecutorService workerPool = Executors.newFixedThreadPool(8);\n\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    if (!records.isEmpty()) {\n        List<CompletableFuture<Void>> futures = new ArrayList<>();\n        for (ConsumerRecord<String, String> record : records) {\n            futures.add(CompletableFuture.runAsync(() -> executeHeavyTransaction(record.value()), workerPool));\n        }\n        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();\n        consumer.commitSync();\n    }\n}",
    "verification": "Monitor JMX metrics `consumer-coordinator-metrics:join-rate` and `rebalance-latency-avg`. Ensure `rebalance-rate` remains near zero during sustained load tests.",
    "date": "2026-09-12",
    "id": 1789216279,
    "type": "error"
});