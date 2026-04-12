window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "resolving-kafka-rebalance-storms",
    "language": "Kafka / Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalances are expensive operations where partition ownership is redistributed. In high-throughput streams, a 'rebalance storm' occurs when consumers are repeatedly kicked out of the group because they fail to process data within the configured timeout window.</p><p>This leads to a vicious cycle: rebalancing stops processing, which increases the lag, which makes the next poll even slower, triggering another rebalance.</p>",
    "root_cause": "The consumer heartbeat thread fails to signal liveness because the processing logic in the main poll loop exceeds 'max.poll.interval.ms', or network jitter causes 'session.timeout.ms' to expire.",
    "bad_code": "// Kafka Config with default/low timeouts\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nprops.put(\"max.poll.records\", \"1000\"); \n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (auto record : records) {\n        // If this processing takes > 5 mins for 1000 records, \n        // the consumer is kicked from the group.\n        heavyCompute(record);\n    }\n}",
    "solution_desc": "Decouple the consumption logic from processing logic using an internal worker queue, or increase 'max.poll.interval.ms' and decrease 'max.poll.records' to ensure processing always completes within the heartbeat window.",
    "good_code": "// Tuning for stability\nprops.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nprops.put(\"max.poll.records\", \"50\"); // Smaller batches\nprops.put(\"session.timeout.ms\", \"45000\"); \n\n// Or use CooperativeStickyAssignor to prevent 'stop-the-world'\nprops.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency' metrics in JMX. A stable system should show near-zero rebalances during steady-state processing.",
    "date": "2026-04-12",
    "id": 1775986724,
    "type": "error"
});