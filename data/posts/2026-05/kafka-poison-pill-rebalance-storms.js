window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Poison Pill Rebalance Storms",
    "slug": "kafka-poison-pill-rebalance-storms",
    "language": "Java",
    "code": "REBALANCE_TIMEOUT_EXCEEDED",
    "tags": [
        "Java",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>A 'Poison Pill' is a message that causes a consumer to fail or hang indefinitely. In a distributed Kafka environment, if a message triggers a long-running process that exceeds <code>max.poll.interval.ms</code>, the consumer is kicked out of the group. This triggers a rebalance. The 'poison' message is then assigned to another consumer, which also fails, causing a continuous 'rebalance storm' that halts all progress across the consumer group.</p><p>This is particularly dangerous in high-throughput systems where the rebalance overhead itself consumes significant CPU and network resources, further delaying message processing.</p>",
    "root_cause": "The processing logic lacks a timeout or exception boundary for individual records, causing the poll loop to exceed the heartbeat threshold.",
    "bad_code": "while (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Infinite loop or 10-minute process on a bad payload\n        heavyProcessing(record.value()); \n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Implement a 'Dead Letter Queue' (DLQ) pattern. Wrap record processing in a try-catch block with a localized timeout. If a record fails or takes too long, send it to a separate 'retry' or 'dead-letter' topic and commit the offset to move forward.",
    "good_code": "try {\n    processWithTimeout(record, Duration.ofSeconds(30));\n} catch (Exception e) {\n    producer.send(new ProducerRecord<>(\"dlq-topic\", record.value()));\n    log.error(\"Poison pill moved to DLQ\", e);\n}\n// Ensure manual offset management to skip failed records",
    "verification": "Monitor the 'rebalance-latency-avg' and 'failed-rebalance-rate-total' metrics in JMX to ensure they stabilize after a poison pill is injected.",
    "date": "2026-05-06",
    "id": 1778065055,
    "type": "error"
});