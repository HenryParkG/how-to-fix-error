window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storm-fix",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput streaming, 'Rebalance Storms' occur when a consumer takes too long to process a batch, exceeding the max.poll.interval.ms. The coordinator marks the consumer dead and triggers a rebalance. As other consumers stop to re-assign partitions, the lag grows, making the next batch even larger and more likely to time out, creating a death spiral of constant rebalancing.</p>",
    "root_cause": "Processing time per batch exceeds 'max.poll.interval.ms', or 'session.timeout.ms' is too low to handle Stop-the-World GC pauses.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (var r : records) { \n        heavyDatabaseSave(r); // If this takes > 5 mins, storm starts\n    }\n}",
    "solution_desc": "Decouple message fetching from processing. Use a thread pool to handle the work and keep the poll loop active, or significantly increase 'max.poll.interval.ms' and decrease 'max.poll.records' to ensure batches remain manageable.",
    "good_code": "properties.put(\"max.poll.records\", \"50\");\nproperties.put(\"max.poll.interval.ms\", \"600000\");\n// Use Incremental Cooperative Rebalancing\nproperties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency-avg' metrics in JMX; they should stabilize at near-zero after initial startup.",
    "date": "2026-03-17",
    "id": 1773710191,
    "type": "error"
});