window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Storms",
    "slug": "fixing-kafka-consumer-rebalance-storms",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>In systems executing long-running, CPU-bound tasks, Kafka consumer groups frequently fall into \"rebalance storms\". A rebalance storm occurs when a consumer takes longer to process its fetched batch of messages than the configured limit, causing it to fail to poll the cluster in time.</p><p>The Kafka cluster group coordinator detects this lack of activity and assumes the consumer is dead, triggering a group rebalance. When the consumer finally finishes its work and tries to commit its offsets, it throws a <code>CommitFailedException</code>. Furthermore, its assigned partitions are reassigned to other consumers, which also fail under the heavy payload, cascading the rebalance across the entire consumer group.</p>",
    "root_cause": "The processing time for a batch of polled messages exceeds 'max.poll.interval.ms', prompting the broker coordinator to evict the consumer and trigger partition rebalancing.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"heavy-cpu-group\");\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 minutes\nprops.put(\"max.poll.records\", \"500\"); // Too high for slow tasks\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"heavy-tasks\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy CPU-bound payload processing (e.g., 1 second per message)\n        executeHeavyTask(record.value()); \n    }\n    consumer.commitSync(); // Fails with CommitFailedException after 500s\n}",
    "solution_desc": "Architecturally decouple the polling thread from the worker processing threads, or reduce `max.poll.records` and increase `max.poll.interval.ms` so that the consumer can always notify the broker within the expected timeout limit.",
    "good_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"heavy-cpu-group\");\nprops.put(\"max.poll.interval.ms\", \"600000\"); // Increase timeout to 10 minutes\nprops.put(\"max.poll.records\", \"10\"); // Limit batch size to protect processing loop\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"heavy-tasks\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Lower payload size guarantees loop completes way before max.poll.interval.ms\n        executeHeavyTask(record.value());\n    }\n    consumer.commitSync();\n}",
    "verification": "Deploy the adjusted consumer configuration. Monitor consumer group lag and ensure that no 'CommitFailedException' logs or group rebalance events occur during peak CPU load.",
    "date": "2026-06-15",
    "id": 1781491689,
    "type": "error"
});