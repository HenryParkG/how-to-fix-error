window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storm-fix",
    "language": "Java",
    "code": "Rebalance-Loop",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur when consumers are repeatedly kicked out of a group, forcing partition reassignment. In high-throughput streams, long processing times or GC pauses cause the consumer to miss its heartbeat, triggering a rebalance that cascades across the entire cluster.</p>",
    "root_cause": "Processing time exceeding the 'max.poll.interval.ms' or 'session.timeout.ms', leading the broker to assume the consumer has failed.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nproperties.put(\"partition.assignment.strategy\", \"RangeAssignor\");\n// Complex logic taking > 5 mins per batch",
    "solution_desc": "Increase poll intervals, implement the CooperativeStickyAssignor to allow incremental rebalancing, and decouple message fetching from processing.",
    "good_code": "properties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nproperties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nproperties.put(\"max.poll.records\", \"100\"); // Smaller batches",
    "verification": "Check Kafka logs for 'Rebalancing group' events. A stable group will show zero rebalances during peak processing hours.",
    "date": "2026-04-09",
    "id": 1775729236,
    "type": "error"
});