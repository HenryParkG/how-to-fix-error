window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms in Cooperative Assignors",
    "slug": "fixing-kafka-rebalance-storms-cooperative-sticky",
    "language": "Java",
    "code": "Kafka CommitFailedException",
    "tags": [
        "Java",
        "Kafka",
        "Distributed Systems",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When using the <code>CooperativeStickyAssignor</code> in high-throughput Apache Kafka consumers, sudden spikes in downstream ingestion latency can trigger cascading consumer group rebalance storms. Although cooperative rebalancing allows unrevoked partitions to continue processing during a rebalance, consumers that exceed <code>max.poll.interval.ms</code> due to slow message processing are marked dead by the group coordinator. Upon rejoining, their partition revocations force consecutive rebalance rounds across the entire consumer group, degrading throughput to zero.</p>",
    "root_cause": "Processing high-latency message batches on the main poll thread exceeds 'max.poll.interval.ms'. The broker considers the consumer dead and triggers a group rebalance, causing continuous assignment reshuffling under steady-state high ingestion latency.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"ingestion-group\");\nprops.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());\nprops.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());\n// BAD: Default max.poll.records (500) paired with slow synchronous processing\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"high-latency-topic\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Blocking database call taking 200ms per record\n        heavyDatabaseIngestion(record.value());\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple partition polling from processing logic using an internal worker queue and dynamic partition pausing (`consumer.pause()`), or tune `max.poll.records` down and increase `max.poll.interval.ms` to guarantee polls occur within tolerance limits.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"ingestion-group\");\nprops.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());\nprops.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());\n\n// GOOD: Restrict max records per poll and extend poll timeout threshold\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 minutes\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"high-latency-topic\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    if (!records.isEmpty()) {\n        processBatchInParallel(records); // Fast asynchronous processing pool\n        consumer.commitAsync();\n    }\n}",
    "verification": "Monitor JMX metrics `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` for `rebalance-latency-avg` and `rebalance-rate-per-hour`. Ensure rebalance counts drop to zero during high downstream latency periods.",
    "date": "2026-08-08",
    "id": 1786150539,
    "type": "error"
});