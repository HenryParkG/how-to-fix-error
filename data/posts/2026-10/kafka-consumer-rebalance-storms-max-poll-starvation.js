window.onPostDataLoaded({
    "title": "Resolving Kafka Rebalance Storms and Poll Starvation",
    "slug": "kafka-consumer-rebalance-storms-max-poll-starvation",
    "language": "Kafka",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Kafka consumer groups, processing batches that take longer than <code>max.poll.interval.ms</code> causes the group coordinator to deem the consumer dead. The broker evicts the consumer and initiates a cluster-wide group rebalance. When the slow consumer attempts to commit offsets, it encounters <code>CommitFailedException</code>. As partitions are reshuffled, subsequent consumers choke on the same uncommitted backlogs, resulting in cascading consumer group rebalance storms.</p>",
    "root_cause": "Blocking long-running computations, unbounded downstream HTTP calls, or excessively large max.poll.records exhaust the time allotment specified by max.poll.interval.ms before poll() can be re-invoked.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 2000);\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000); // 5 mins\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> record : records) {\n        // Synchronous heavy call blocking the loop across 2000 items\n        sendSyncExternalHttpRequest(record.value()); \n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple message fetching from processing via a bounded worker thread pool, tune max.poll.records to reflect real-world throughput, increase max.poll.interval.ms, or utilize cooperative rebalancing (CooperativeStickyAssignor) to avoid total partition revocation during group membership changes.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 600000); // 10 mins\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\n// Process records concurrently or poll continuously while maintaining heartbeats",
    "verification": "Monitor JMX consumer metrics `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` to confirm `rebalance-rate-per-hour` stabilizes to near zero and poll latency remains well within threshold bounds.",
    "date": "2026-10-12",
    "id": 1791775637,
    "type": "error"
});