window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Max Poll Interval Rebalance Loops",
    "slug": "kafka-max-poll-interval-rebalance-fix",
    "language": "Kafka / Java",
    "code": "ConsumerRebalance",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When processing heavy payloads in Kafka, consumers often fall into a 'rebalance loop'. This happens when the time taken to process a single batch of records exceeds the <code>max.poll.interval.ms</code> configuration. The Kafka coordinator assumes the consumer has failed and triggers a rebalance.</p><p>The consumer then rejoins, receives the same batch, exceeds the limit again, and the cycle repeats, leading to zero progress and high CPU/Network overhead.</p>",
    "root_cause": "Processing time per batch exceeds the configured max.poll.interval.ms, causing the group coordinator to kick the consumer.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// Processing logic\nwhile (true) {\n    ConsumerRecords<String, byte[]> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord record : records) {\n        heavyTransform(record); // Takes 10 minutes for large blobs\n    }\n}",
    "solution_desc": "Decouple message fetching from processing using an internal queue and a worker thread pool, or significantly increase the poll interval while reducing the number of records per poll.",
    "good_code": "properties.put(\"max.poll.records\", \"5\");\nproperties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\n// Or use a background worker and pause the consumer\nconsumer.pause(consumer.assignment());\nexecutor.submit(() -> {\n    process(records);\n    consumer.resume(consumer.assignment());\n});",
    "verification": "Monitor the 'join-rate' and 'rebalance-rate' metrics in Prometheus; they should stabilize at zero during peak load.",
    "date": "2026-04-17",
    "id": 1776410437,
    "type": "error"
});