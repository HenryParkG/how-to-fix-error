window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms",
    "language": "Java",
    "code": "ConsumerGroupRebalanceException",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kafka rebalance storms occur in high-throughput environments when a consumer is kicked out of a group for taking too long to process a batch, causing its partitions to be reassigned. This reassignment triggers other consumers to stop, leading to a cascading failure where the cluster spends more time rebalancing than processing data.</p><p>The cycle typically begins when a heavy processing task exceeds the <code>max.poll.interval.ms</code>, leading the Group Coordinator to mark the consumer as dead, even if the heartbeat thread is still alive.</p>",
    "root_cause": "The processing logic within the poll loop exceeds 'max.poll.interval.ms', or 'session.timeout.ms' is too low to account for transient network jitter, causing frequent member leaves and joins.",
    "bad_code": "properties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 mins\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy DB operation or external API call that takes 10 seconds\n        processRecord(record); \n    }\n}",
    "solution_desc": "Implement the 'Cooperative Sticky Assignor' to allow incremental rebalancing and decouple the processing logic from the polling thread using a thread pool. Additionally, tune 'max.poll.interval.ms' to be significantly higher than the maximum expected processing time for a single batch.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\"); // 15 mins\n\n// Use a dedicated executor for processing to keep the poll loop responsive\nExecutorService executor = Executors.newFixedThreadPool(10);\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    executor.submit(() -> processBatch(records));\n}",
    "verification": "Monitor the 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-latency-avg' metric. It should stabilize and decrease as unnecessary rebalances are avoided.",
    "date": "2026-02-25",
    "id": 1771994918,
    "type": "error"
});