window.onPostDataLoaded({
    "title": "Fixing Kafka Cooperative Sticky Rebalance Storms",
    "slug": "fixing-kafka-cooperative-sticky-rebalance-storms",
    "language": "Java",
    "code": "RebalanceException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>The <code>CooperativeStickyAssignor</code> was designed to eliminate stop-the-world rebalances in Apache Kafka by allowing non-revoked partitions to continue processing during assignments. However, under high consumer lag, long processing loops can exceed <code>max.poll.interval.ms</code>. When this occurs, the group coordinator assumes the consumer is dead and evicts it. As the evicted consumer completes its batch and attempts to rejoin, it triggers a cascading rebalance across the remaining lagging members, causing continuous rebalance storms that halt cluster throughput.</p>",
    "root_cause": "Long-running message processing batches during lag recovery cause consumers to breach 'max.poll.interval.ms', causing worker eviction and endless rebalance loops.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"heavy-lag-group\");\n// BUG: High batch size coupled with default poll interval leads to timeout\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"5000\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 minutes\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"high-throughput-topic\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy database writes causing batch processing time > max.poll.interval.ms\n        processSlowRecord(record);\n    }\n}",
    "solution_desc": "Architecturally decouple message ingestion from processing by introducing a bounded worker pool and dynamic pause/resume semantics on the Kafka consumer. Decrease 'max.poll.records' and scale 'max.poll.interval.ms' appropriately to guarantee timely polls.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"heavy-lag-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"200\"); // Reduced batch size\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\"); // Increased limit\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"high-throughput-topic\"));\nExecutorService executor = new ThreadPoolExecutor(4, 4, 0L, TimeUnit.MILLISECONDS, new ArrayBlockingQueue<>(50));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Process asynchronously with backpressure handling\n        executor.submit(() -> processRecord(record));\n    }\n}",
    "verification": "Monitor 'kafka.consumer:type=consumer-coordinator-metrics' for 'rebalance-latency-avg' and ensure 'join-rate' drops to zero during processing bursts.",
    "date": "2026-07-27",
    "id": 1785154306,
    "type": "error"
});