window.onPostDataLoaded({
    "title": "Fix Kafka Rebalance Loops in Long Tasks",
    "slug": "kafka-consumer-rebalance-loop-fix",
    "language": "Kafka",
    "code": "MaxPollExceeded",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumers trigger a rebalance if the time between two poll() calls exceeds 'max.poll.interval.ms'. If a single batch of records takes too long to process (e.g., due to slow DB writes), the group coordinator assumes the consumer is dead, kicks it out, and reassigns partitions. When the processing finally finishes and the consumer polls again, it finds it's been evicted, joins again, and the cycle repeats indefinitely.</p>",
    "root_cause": "The processing logic for a single batch of records exceeds the configured max.poll.interval.ms threshold.",
    "bad_code": "// Properties: max.poll.interval.ms = 300000 (5 mins)\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // This takes 10 seconds per record, 100 records = 1000s\n        processSlowTask(record);\n    }\n}",
    "solution_desc": "Either increase 'max.poll.interval.ms' to match the worst-case processing time, or decrease 'max.poll.records' to ensure small batches can be finished within the deadline.",
    "good_code": "// Fix: Reduce batch size and increase timeout\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"10\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\");\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    processInParallelOrSmallBatches(records);\n}",
    "verification": "Monitor 'join-rate' and 'rebalance-total' metrics in JMX. If they stabilize after the first join, the loop is fixed.",
    "date": "2026-03-18",
    "id": 1773827024,
    "type": "error"
});