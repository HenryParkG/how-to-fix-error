window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Rebalance Storms",
    "slug": "fixing-kafka-consumer-group-rebalance-storms",
    "language": "Kafka",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalances occur when a consumer leaves or joins a group. While normal in dynamic environments, a 'rebalance storm' occurs when consumers are repeatedly kicked out of the group and forced to rejoin in a continuous, cascading loop.</p><p>This loop usually happens when message processing takes longer than the configured <code>max.poll.interval.ms</code>. The coordinator assumes the consumer is dead, triggers a rebalance, and transfers its partitions to other consumers. When the old consumer finishes, it tries to commit offsets, hits a <code>CommitFailedException</code>, and rejoins, triggering another rebalance.</p>",
    "root_cause": "The consumer poll loop processes a high volume of records (max.poll.records) synchronously, exceeding the max.poll.interval.ms timeout threshold. This forces the Kafka broker to mark the client as inactive.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"slow-processing-group\");\nprops.put(\"max.poll.records\", \"1000\"); // High batch count\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 minutes\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"slow-topic\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        processRecordSlowly(record); // Taking 500ms per record -> 500 seconds total! Exceeds timeout.\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Architecturally decouple message polling from execution. Lower the 'max.poll.records' setting, increase 'max.poll.interval.ms', and utilize an asynchronous thread-pool wrapper with manual commit management to ensure the main poll loop is updated consistently.",
    "good_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"slow-processing-group\");\nprops.put(\"max.poll.records\", \"50\"); // Lower batch size\nprops.put(\"max.poll.interval.ms\", \"600000\"); // 10 minutes timeout\nprops.put(\"enable.auto.commit\", \"false\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"slow-topic\"));\n\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    if (!records.isEmpty()) {\n        for (ConsumerRecord<String, String> record : records) {\n            processRecordSlowly(record); \n        }\n        consumer.commitSync();\n    }\n}",
    "verification": "Monitor JVM logs for 'CommitFailedException' and check Kafka Broker JMX metrics: 'rebalance-latency-avg' and 'join-rate'. Verify that consumer group status stabilizes to 'Stable' and remains active during processing surges.",
    "date": "2026-06-13",
    "id": 1781317945,
    "type": "error"
});