window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-group-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Kafka",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In massive-scale Kafka clusters, a single slow consumer can trigger a 'rebalance storm.' When a consumer fails to call poll() within the max.poll.interval.ms, the broker marks it dead and redistributes its partitions. This causes other consumers to stop and restart, often leading to a cascade of timeouts and zero throughput across the group.</p>",
    "root_cause": "The processing logic inside the poll loop takes longer than 'max.poll.interval.ms', or the 'heartbeat.interval.ms' is too high relative to 'session.timeout.ms'.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        heavyProcessing(record); // If this takes > 5 mins total, rebalance occurs\n    }\n}",
    "solution_desc": "Switch to the 'CooperativeStickyAssignor' to allow incremental rebalancing, and decouple processing from the polling thread using a worker pool to ensure poll() is called consistently.",
    "good_code": "properties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nproperties.put(\"max.poll.interval.ms\", \"900000\"); // Increase to 15 mins\n// Implement thread pool for heavyProcessing(record);",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency' metrics in JMX; they should stabilize near zero during steady-state operation.",
    "date": "2026-05-12",
    "id": 1778565478,
    "type": "error"
});