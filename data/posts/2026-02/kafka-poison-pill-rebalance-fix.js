window.onPostDataLoaded({
    "title": "Fixing Kafka Poison Pill Consumer Rebalancing",
    "slug": "kafka-poison-pill-rebalance-fix",
    "language": "Kafka",
    "code": "ConsumerTimeout",
    "tags": [
        "Java",
        "Kafka",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>A 'Poison Pill' is a record that fails consistently during processing. In Kafka, if a message causes the consumer to hang or crash repeatedly, the consumer fails to send heartbeats or exceeds <code>max.poll.interval.ms</code>. This triggers a group rebalance, shifting the problematic record to another consumer, which then also crashes, leading to a 'rebalance storm' that halts the entire pipeline.</p>",
    "root_cause": "The consumer processing logic lacks an isolated error boundary or a Dead Letter Queue (DLQ) mechanism, causing processing time to exceed the maximum allowed poll interval.",
    "bad_code": "while (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // If this throws an unhandled exception or hangs,\n        // the whole group rebalances.\n        processHeavyLogic(record.value());\n    }\n}",
    "solution_desc": "Implement a try-catch block within the loop to catch exceptions, send failed records to a Dead Letter Topic (DLT), and commit the offset to move forward.",
    "good_code": "for (ConsumerRecord<String, String> record : records) {\n    try {\n        processHeavyLogic(record.value());\n    } catch (Exception e) {\n        sendToDeadLetterQueue(record);\n        consumer.commitSync(Collections.singletonMap(partition, new OffsetAndMetadata(record.offset() + 1)));\n    }\n}",
    "verification": "Produce a malformed message to the topic and observe if the consumer group remains 'STABLE' while the message moves to the DLT.",
    "date": "2026-02-13",
    "id": 1770965369,
    "type": "error"
});