window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Rebalance Storms",
    "slug": "resolve-kafka-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>A rebalance storm occurs when high-throughput streams cause processing times to exceed the max.poll.interval.ms. This leads the coordinator to believe the consumer has failed, triggering a rebalance. Because rebalances pause all consumers in the group, the lag increases, making the next processing cycle even longer, leading to a vicious cycle of constant rebalancing and zero throughput.</p>",
    "root_cause": "Processing logic duration exceeds the 'max.poll.interval.ms' configuration, or 'max.poll.records' is too high for the given processing latency.",
    "bad_code": "// Consumer properties\nprops.put(\"max.poll.records\", \"500\");\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        heavyProcessing(record); // If total time > 5m, rebalance triggers\n    }\n}",
    "solution_desc": "Decouple message fetching from processing. Increase max.poll.interval.ms, decrease max.poll.records, or use an internal thread pool to process messages while the main consumer thread continues to poll and send heartbeats.",
    "good_code": "props.put(\"max.poll.records\", \"50\"); // Process fewer items per poll\nprops.put(\"max.poll.interval.ms\", \"600000\"); // Increase timeout to 10 mins\n\n// Alternative: Background processing\nExecutorService executor = Executors.newFixedThreadPool(10);\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    executor.submit(() -> {\n        records.forEach(r -> heavyProcessing(r));\n    });\n}",
    "verification": "Monitor JMX metrics 'consumer-coordinator-metrics:join-rate' and 'rebalance-latency-avg'. A stable group should have a join-rate near zero.",
    "date": "2026-03-05",
    "id": 1772703273,
    "type": "error"
});