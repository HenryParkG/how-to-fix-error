window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storms-latency",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in high-latency pipelines when a consumer takes longer to process a batch of records than the configured <code>max.poll.interval.ms</code>. This causes the broker to assume the consumer has failed, kicking it out of the group.</p><p>As the consumer rejoins, it triggers a rebalance for the entire group, pausing all other consumers. If multiple consumers are struggling with latency, this creates a recursive 'storm' where the group never reaches a stable state.</p>",
    "root_cause": "Processing time per batch exceeds 'max.poll.interval.ms', or heartbeats are blocked by long-running synchronous operations in the main poll loop.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // CRITICAL ERROR: Synchronous heavy processing (e.g., 10 min API call)\n        processRemoteData(record);\n    }\n}",
    "solution_desc": "Increase 'max.poll.interval.ms' to account for worst-case latency, or decouple processing from the poll loop using an internal worker queue and manual offsets.",
    "good_code": "Properties props = new Properties();\nprops.put(\"max.poll.interval.ms\", \"900000\"); // Increase to 15 mins\nprops.put(\"max.poll.records\", \"10\"); // Reduce batch size\n\n// Alternative: Parallel processing with manual heartbeating\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    if (!records.isEmpty()) {\n        processInParallel(records); // Logic ensures poll() is called frequently\n    }\n}",
    "verification": "Monitor 'kafka_consumer_group_rebalance_rate_total' in Prometheus. If stable, the rate should drop to near zero after deployment.",
    "date": "2026-02-18",
    "id": 1771377549,
    "type": "error"
});