window.onPostDataLoaded({
    "title": "Fixing Apache Kafka Rebalance Storms",
    "slug": "fixing-kafka-rebalance-storms",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In heavy data processing pipelines, Apache Kafka consumers frequently fall into a destructive loop known as a 'rebalance storm'. This occurs when the time taken to process a single batch of records retrieved via <code>poll()</code> exceeds the configured <code>max.poll.interval.ms</code>. When this threshold is crossed, the group coordinator presumes the consumer has died, evicts it from the group, and triggers a rebalance. As other active consumers attempt to take over the reassigned partitions, they too may choke on the heavy workload, leading to cascading failures across the entire consumer group.</p>",
    "root_cause": "The consumer thread takes longer to process a batch of records than the duration specified by 'max.poll.interval.ms', causing the Kafka coordinator to mark the consumer dead and initiate a partition rebalance.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"heavy-processor\");\n// Default max.poll.interval.ms is 300000 (5 minutes)\n// Processing 500 records might take longer than 5 minutes\nprops.put(\"max.poll.records\", \"500\"); \n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"heavy-tasks\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // High-latency processing (e.g., external API call, database write)\n        executeHeavyTask(record.value()); \n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Mitigate rebalance storms by decreasing the maximum number of records returned in a single poll using 'max.poll.records', increasing 'max.poll.interval.ms' to accommodate spikes in latency, or decoupling record ingestion from processing using an internal thread pool.",
    "good_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"heavy-processor\");\n// Restrict the batch size and extend the processing deadline\nprops.put(\"max.poll.records\", \"50\"); \nprops.put(\"max.poll.interval.ms\", \"600000\"); // 10 minutes\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"heavy-tasks\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        executeHeavyTask(record.value());\n    }\n    consumer.commitSync();\n}",
    "verification": "Monitor the Kafka consumer group state using 'kafka-consumer-groups.sh --describe'. Verify that 'rebalance' events drop to near zero during high-load periods and that the consumer log no longer outputs 'CommitFailedException'.",
    "date": "2026-06-05",
    "id": 1780660598,
    "type": "error"
});