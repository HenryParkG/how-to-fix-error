window.onPostDataLoaded({
    "title": "Preventing Kafka Consumer Rebalance Storms",
    "slug": "preventing-kafka-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>Kafka rebalance storms occur when consumers in a group are repeatedly kicked out and re-joined. In high-latency pipelines, this is usually caused by processing logic taking longer than the configured <code>max.poll.interval.ms</code>. When the heartbeat thread continues but the main processing thread hangs, the broker assumes the consumer is alive but 'stuck', triggering a rebalance that cascades as other consumers take on the extra load and also timeout.</p>",
    "root_cause": "The time spent processing a single batch of records exceeded 'max.poll.interval.ms', causing the coordinator to revoke partitions.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Problem: High latency processing (e.g., 6 mins)\n        heavyProcessing(record);\n    }\n}",
    "solution_desc": "Increase `max.poll.interval.ms` to accommodate the slowest possible batch, or better yet, decouple the poll loop from the processing logic using an internal queue and worker thread pool.",
    "good_code": "props.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nprops.put(\"max.poll.records\", \"10\"); // Reduce batch size\n\n// Or decouple:\nExecutorService executor = Executors.newFixedThreadPool(10);\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    executor.submit(() -> {\n        processRecords(records);\n        consumer.commitAsync();\n    });\n}",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency-avg' metrics in JMX. A stable group will show zero rebalances during peak latency periods.",
    "date": "2026-02-23",
    "id": 1771839889,
    "type": "error"
});