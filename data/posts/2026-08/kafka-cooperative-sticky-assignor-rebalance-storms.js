window.onPostDataLoaded({
    "title": "Fixing Kafka Cooperative Sticky Assignor Rebalance Storms",
    "slug": "kafka-cooperative-sticky-assignor-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Kafka",
        "Java",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>The <code>CooperativeStickyAssignor</code> was designed to eliminate stop-the-world rebalances in Apache Kafka by allowing non-affected partitions to continue processing during group membership changes. However, under dynamic dynamic workload spikes or long GC pauses, consumers can exceed <code>max.poll.interval.ms</code>. This triggers continuous, cascading consumer revokes across multiple group generations, resulting in severe rebalance storms and consumer processing stalls.</p>",
    "root_cause": "Exceeding `max.poll.interval.ms` forces the broker to consider the consumer instance dead. Even with cooperative rebalancing, repeated worker timeouts trigger continuous incremental rebalancing loops where consumer instances continuously revoke and re-assign partitions before stabilizing.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"heavy-processor\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n// Default max.poll.interval.ms (300000ms) with high record limits\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 5000);\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"telemetry-topic\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy blocking computation causing max.poll.interval.ms breach\n        processHeavyWorkload(record);\n    }\n}",
    "solution_desc": "Decouple stream polling from batch execution using an internal bounded task queue or offload worker threads. Lower `max.poll.records` and increase `max.poll.interval.ms` to give heavy processing batches enough threshold headroom.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"heavy-processor\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\n// Lower records per poll and extend processing timeout window\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 200);\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 900000); // 15 mins\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"telemetry-topic\"));",
    "verification": "Monitor JMX MBean `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` for `rebalance-latency-avg`, `rebalance-total`, and track assigned partitions count stability during heavy dynamic load testing.",
    "date": "2026-08-13",
    "id": 1786596289,
    "type": "error"
});