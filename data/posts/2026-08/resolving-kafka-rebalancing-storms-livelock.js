window.onPostDataLoaded({
    "title": "Resolving Kafka Rebalancing Storms & Livelock",
    "slug": "resolving-kafka-rebalancing-storms-livelock",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Java",
        "Kafka",
        "Distributed Systems",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalancing storms occur when one or more consumers exceed their configured <code>max.poll.interval.ms</code> processing window. When batch processing takes longer than this threshold, the consumer coordinator assumes the consumer instance has died, drops it from the group, and triggers a partition rebalance.</p><p>As partitions are reassigned, the revoked consumer attempts to commit offsets, resulting in a <code>CommitFailedException</code>. The consumer then rejoins the group, receives partitions again, and restarts processing the same uncommitted batch, creating an infinite livelock cycle where progress ceases and cluster rebalance storms degrade overall throughput.</p>",
    "root_cause": "Processing latency per batch exceeds `max.poll.interval.ms` due to blocking downstream I/O without tuning `max.poll.records` or decoupling polling from task execution.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"500\"); // High batch count\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"30000\"); // 30s timeout\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Blocking network call taking ~100ms per record (500 * 100ms = 50s > 30s limit)\n        processOrderThroughSlowHttpApi(record.value());\n    }\n    consumer.commitSync(); // Throws CommitFailedException\n}",
    "solution_desc": "Enable the Cooperative Sticky Assignor (CooperativeStickyAssignor) to avoid stop-the-world partition revocations. Lower `max.poll.records` to a manageable size, or implement an asynchronous worker pool with pause/resume backpressure to keep heartbeat loops responsive.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\"); // Reduced batch size\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 minutes\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    org.apache.kafka.clients.consumer.CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    if (!records.isEmpty()) {\n        for (ConsumerRecord<String, String> record : records) {\n            processOrderThroughSlowHttpApi(record.value());\n        }\n        consumer.commitSync();\n    }\n}",
    "verification": "Monitor JMX metrics `consumer-coordinator-metrics:rebalance-latency-avg` and verify `rebalance-rate-per-hour` drops to near zero during normal peak load.",
    "date": "2026-08-24",
    "id": 1787532160,
    "type": "error"
});