window.onPostDataLoaded({
    "title": "The Kafka Rebalance Storm: Fixing Infinite Consumer Loops",
    "slug": "kafka-rebalance-storm-heartbeat-fix",
    "language": "Java (Apache Kafka)",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Reliability",
        "Error Fix"
    ],
    "analysis": "<p>A 'Rebalance Storm' occurs when a Kafka consumer group enters a continuous state of repartitioning, preventing any actual data processing. This usually happens because the consumer's background heartbeat thread and the main processing loop fall out of sync with the broker's expectations.</p><p>When a consumer takes longer to process a batch of records than the <code>max.poll.interval.ms</code>, it is considered 'lame' by the broker. The coordinator triggers a rebalance to reassign its partitions. However, once that consumer finishes its current batch and calls <code>poll()</code> again, it attempts to rejoin the group, triggering <i>yet another</i> rebalance. In high-throughput or compute-heavy environments, this creates a 'livelock' where consumers spend 90% of their time rejoining the group and 0% committing offsets.</p>",
    "root_cause": "Processing time per batch exceeds max.poll.interval.ms or network instability causes heartbeat loss beyond the session.timeout.ms threshold.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"heavy-task-group\");\n// DEFAULT is 5 minutes. If processTask() takes 6 minutes, a rebalance triggers.\nprops.put(\"max.poll.interval.ms\", \"300000\"); \n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"heavy-tasks\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // BUG: This function occasionally takes 6+ minutes, exceeding max.poll.interval.ms\n        processHeavyAnalytics(record);\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "To stop the storm, align max.poll.interval.ms with the absolute worst-case processing time for a single batch. Additionally, ensure session.timeout.ms is high enough to survive GC pauses, with heartbeat.interval.ms set to 1/3 of that value.",
    "good_code": "Properties props = new Properties();\n// 1. Set interval to exceed maximum expected processing time (e.g., 15 mins)\nprops.put(\"max.poll.interval.ms\", \"900000\");\n\n// 2. Reduce max records to make processing time more predictable\nprops.put(\"max.poll.records\", \"10\");\n\n// 3. Tune heartbeat for network resilience\nprops.put(\"session.timeout.ms\", \"45000\");\nprops.put(\"heartbeat.interval.ms\", \"15000\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\n// ... rest of implementation",
    "verification": "Monitor the JMX metric 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-rate-avg'. If the rate is > 0 for extended periods while 'join-rate-avg' is high, the storm is active. Verify that 'rebalance-latency-avg' decreases after applying the configuration changes.",
    "date": "2026-02-11",
    "id": 1770766606
});