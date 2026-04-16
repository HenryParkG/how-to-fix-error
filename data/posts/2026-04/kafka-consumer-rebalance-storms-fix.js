window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms-fix",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "DistributedSystems",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Kafka streams, 'Rebalance Storms' occur when consumers are kicked out of a group because they take too long to process a single batch. This triggers a rebalance, pausing all consumers, which increases the lag, leading to even longer processing times in the next cycle\u2014a vicious feedback loop that halts data flow.</p>",
    "root_cause": "The processing logic exceeds the 'max.poll.interval.ms' threshold, causing the coordinator to mark the consumer as dead, even if it is still sending heartbeats via the background thread.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// Complex logic that sometimes takes 6 minutes per batch\nconsumer.poll(Duration.ofMillis(100)).forEach(record -> {\n    heavyTransformation(record);\n    externalApiCall(record);\n});",
    "solution_desc": "Increase 'max.poll.interval.ms' to account for worst-case processing time and implement Static Membership (using 'group.instance.id') to allow consumers to restart without triggering a rebalance if they return within the session timeout.",
    "good_code": "properties.put(\"group.instance.id\", \"consumer-1\");\nproperties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nproperties.put(\"session.timeout.ms\", \"45000\");\n// Optimized polling\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    processInParallel(records); // Use internal worker threads\n}",
    "verification": "Monitor JMX metrics for 'rebalance-total' and 'rebalance-latency-avg'. A successful fix shows these metrics remaining stable during peak traffic spikes.",
    "date": "2026-04-16",
    "id": 1776304165,
    "type": "error"
});