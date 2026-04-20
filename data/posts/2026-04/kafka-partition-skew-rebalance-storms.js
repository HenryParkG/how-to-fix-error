window.onPostDataLoaded({
    "title": "Mitigating Kafka Partition Skew & Rebalance Storms",
    "slug": "kafka-partition-skew-rebalance-storms",
    "language": "Kafka/Java",
    "code": "System Instability",
    "tags": [
        "Java",
        "Kafka",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer groups often suffer from 'Rebalance Storms' where members repeatedly join and leave the group, causing massive processing lag. This is frequently coupled with partition skew, where a single consumer is overloaded while others remain idle. This cycle is usually triggered by long-running message processing that exceeds the <code>max.poll.interval.ms</code>, leading the broker to believe the consumer has failed, thus triggering a rebalance that further stalls the pipeline.</p>",
    "root_cause": "Heavy processing logic blocking the poll loop longer than the configured timeout, combined with the default RangeAssignor which causes uneven distribution on small partition counts.",
    "bad_code": "properties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.RangeAssignor\");\nproperties.put(\"max.poll.interval.ms\", \"300000\"); // Too low for heavy ETL\n\nwhile (true) {\n    ConsumerRecords records = consumer.poll(Duration.ofMillis(100));\n    processExtremelySlow(records); // Takes 10 minutes\n}",
    "solution_desc": "Switch to the CooperativeStickyAssignor to allow incremental rebalancing (no stop-the-world). Increase max.poll.interval.ms to exceed the worst-case processing time and implement internal pre-fetching or parallel processing.",
    "good_code": "properties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nproperties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nproperties.put(\"max.poll.records\", \"50\"); // Process fewer at once",
    "verification": "Monitor 'rebalance-rate-per-hour' in JMX. Check 'records-lag-max' across consumers to ensure even distribution using the Sticky strategy.",
    "date": "2026-04-20",
    "id": 1776671539,
    "type": "error"
});