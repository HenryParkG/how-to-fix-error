window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in high-partition Kafka clusters when consumers are frequently kicked out of a group, triggering a cascade of partition reassignments. This usually leads to 'stop-the-world' processing pauses across the entire consumer group.</p><p>In large clusters, the default rebalance protocol can take minutes to converge, during which no data is processed. This is often exacerbated by consumers taking too long to process a single batch, exceeding the poll timeout and being marked as dead by the coordinator.</p>",
    "root_cause": "Processing time exceeding 'max.poll.interval.ms' or transient network issues causing heartbeat failures beyond 'session.timeout.ms'.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\nproperties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.RangeAssignor\");\n// Processing loop takes 6+ minutes occasionally",
    "solution_desc": "Switch to the Incremental Cooperative Rebalance protocol to avoid global pauses and increase the max poll interval to accommodate worst-case processing spikes.",
    "good_code": "properties.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nproperties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nproperties.put(\"session.timeout.ms\", \"45000\"); // 45 sec",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency-avg' metrics in JMX to ensure reassignments are incremental and stable.",
    "date": "2026-04-11",
    "id": 1775882979,
    "type": "error"
});