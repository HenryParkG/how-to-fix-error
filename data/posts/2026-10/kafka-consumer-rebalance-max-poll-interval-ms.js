window.onPostDataLoaded({
    "title": "Fix Kafka Consumer Group max.poll.interval.ms Storms",
    "slug": "kafka-consumer-rebalance-max-poll-interval-ms",
    "language": "Kafka",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Concurrency",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Kafka clients, the consumer coordinator separates consumer liveness heartbeats from record processing loops. Heartbeats are managed by a dedicated background thread to verify network reachability. However, client health is dictated by whether <code>poll()</code> is invoked within <code>max.poll.interval.ms</code>.</p><p>When a consumer receives a batch of records and processing exceeds this threshold\u2014often caused by downstream latency, slow database transactions, or large batch sizes\u2014the coordinator marks the consumer dead. The consumer is forcibly evicted from the consumer group, triggering a full partition rebalance. When the evicted consumer finishes its work and calls <code>poll()</code> or <code>commitSync()</code>, it throws <code>CommitFailedException</code>, fails the commit, and re-joins the group, creating a cascade of continuous rebalance storms and duplicate processing.</p>",
    "root_cause": "Synchronous processing of a poll batch takes longer than `max.poll.interval.ms`, causing the group coordinator to deem the consumer inactive and trigger group rebalances.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"1000\"); // High batch count\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"30000\"); // 30 seconds\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> record : records) {\n        // Blocking I/O: 100ms per record * 1000 records = 100 seconds! exceeds 30s max.poll.interval.ms\n        processSlowOrder(record.value()); \n    }\n    consumer.commitSync(); // Throws CommitFailedException!\n}",
    "solution_desc": "Resolve the imbalance by decoupling message consumption from business logic execution using a bounded worker pool or reducing `max.poll.records` to match known processing times. Additionally, migrate to the `CooperativeStickyAssignor` to allow non-revoked partitions to continue consuming during rebalances instead of halting the entire consumer group.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processing-group\");\n// 1. Constrain batch size to guaranteed latency bounds\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\");\n// 2. Increase threshold to accommodate downstream tail latency\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 minutes\n// 3. Enable cooperative rebalancing to avoid 'stop-the-world' rebalances\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,\n    org.apache.kafka.clients.consumer.CooperativeStickyAssignor.class.getName());\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    if (!records.isEmpty()) {\n        for (ConsumerRecord<String, String> record : records) {\n            processSlowOrder(record.value());\n        }\n        consumer.commitAsync(); // Non-blocking commit\n    }\n}",
    "verification": "Monitor the JMX metric `records-lead` and `rebalance-rate-per-hour` alongside `org.apache.kafka.clients.consumer:type=consumer-coordinator-metrics`. The rebalance rate should drop to near zero during steady-state processing.",
    "date": "2026-10-21",
    "id": 1792592100,
    "type": "error"
});