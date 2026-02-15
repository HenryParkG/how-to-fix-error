window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms in High-Latency Streams",
    "slug": "kafka-rebalance-heartbeat-timeouts",
    "language": "Java",
    "code": "REBALANCE_STORM",
    "tags": [
        "Java",
        "Kafka",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Kafka rebalance storms occur when consumer group members are repeatedly kicked out and rejoined, halting all processing. In high-latency stream processing, this is usually triggered because the processing logic within the poll loop takes longer than the maximum allowed interval.</p><p>When the consumer fails to call <code>poll()</code> within the <code>max.poll.interval.ms</code>, the coordinator assumes the consumer has failed. This triggers a group-wide rebalance. The 'storm' happens because the rebalance itself adds overhead, causing other consumers to also timeout, creating a vicious cycle of instability.</p>",
    "root_cause": "The processing time per batch exceeds 'max.poll.interval.ms', or the heartbeat thread is starved due to high GC pressure or CPU saturation.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// Heavy processing inside the poll loop\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // This 10-second task multiplied by 100 records = 1000s\n        // Overrides the 300s max.poll.interval.ms\n        processHeavyTask(record);\n    }\n}",
    "solution_desc": "Decouple the heartbeat from the processing logic. Increase the poll interval to accommodate the worst-case processing time and reduce the number of records fetched per poll to ensure completion within the heartbeat window.",
    "good_code": "properties.put(\"max.poll.records\", \"10\"); // Process fewer records\nproperties.put(\"max.poll.interval.ms\", \"600000\"); // Increase to 10 mins\nproperties.put(\"session.timeout.ms\", \"45000\"); // Heartbeat timeout\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    processRecords(records); // Logic now fits within 10 minutes\n}",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency' metrics in JMX. If rebalances drop to zero during high-load periods, the configuration is stable.",
    "date": "2026-02-15",
    "id": 1771118455,
    "type": "error"
});