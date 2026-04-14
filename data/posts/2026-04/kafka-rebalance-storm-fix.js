window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Rebalance Storms",
    "slug": "kafka-rebalance-storm-fix",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur when consumers in a group repeatedly trigger membership changes, causing the 'Stop-the-World' effect where no data is processed. This is frequently caused by a mismatch between <code>max.poll.interval.ms</code> and the actual time taken to process a batch of messages. If processing takes longer than the interval, the consumer stops sending heartbeats, the coordinator marks it dead, and a rebalance is triggered, which often cascades as other consumers take on the extra load and also timeout.</p>",
    "root_cause": "Message processing logic exceeding max.poll.interval.ms, causing the group coordinator to assume consumer failure.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// In consumer loop\nConsumerRecords records = consumer.poll(1000);\nfor (Record r : records) {\n    expensive_computation(r); // Takes 10 mins occasionally\n}",
    "solution_desc": "Increase <code>max.poll.interval.ms</code> to exceed the worst-case processing time, or preferably, decouple the message fetching from processing using an internal thread pool while maintaining heartbeats on the main thread.",
    "good_code": "properties.put(\"max.poll.interval.ms\", \"600000\");\nproperties.put(\"session.timeout.ms\", \"45000\");\n// Ensure processing is wrapped in try-catch to prevent thread death\nexecutor.submit(() -> process(record));",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency' metrics in JMX or Confluent Control Center; they should stabilize after the change.",
    "date": "2026-04-14",
    "id": 1776151138,
    "type": "error"
});