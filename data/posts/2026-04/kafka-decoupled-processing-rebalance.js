window.onPostDataLoaded({
    "title": "Eliminating Kafka Rebalance Storms via Decoupled Loops",
    "slug": "kafka-decoupled-processing-rebalance",
    "language": "Kafka",
    "code": "Rebalance Storm",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur when consumer processing time exceeds the 'max.poll.interval.ms' threshold. When this happens, the Kafka broker assumes the consumer has failed and triggers a rebalance. If the processing logic is heavy, the new consumer assigned the partition might also time out, causing a recursive loop of rebalances across the cluster, effectively halting data throughput.</p>",
    "root_cause": "The tight coupling of the Kafka poll() loop and the business logic execution blocks the heartbeat mechanism in the consumer background thread.",
    "bad_code": "while (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        heavyBusinessLogic(record); // If this takes > 5 mins, rebalance triggers\n    }\n}",
    "solution_desc": "Decouple message fetching from processing. Use a dedicated worker pool (ExecutorService) for processing while the main thread continues to poll the broker and maintain heartbeats. Use consumer.pause() if the worker queue is full to prevent memory overflow.",
    "good_code": "while (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    if (!records.isEmpty()) {\n        workerPool.submit(() -> {\n            process(records);\n            // Manual offset commit logic here\n        });\n    }\n    // Main thread remains free to poll and heartbeat\n}",
    "verification": "Monitor the 'kafka_consumer_group_rebalance_count' metric. It should stabilize to near zero during high load after decoupling.",
    "date": "2026-04-29",
    "id": 1777428229,
    "type": "error"
});