window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storms-massive-partitions",
    "language": "Java",
    "code": "REBALANCE_IN_PROGRESS",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In clusters managing thousands of partitions, consumer group rebalancing can become a performance nightmare known as a 'Rebalance Storm'. When a single consumer experiences a GC pause or network blip, the Eager Rebalance protocol forces every consumer in the group to stop processing, commit offsets, and wait for a new assignment. At scale, the overhead of re-assigning thousands of partitions exceeds the heartbeat timeout, causing a recursive loop of failures.</p>",
    "root_cause": "The default Eager Rebalance protocol causes a 'stop-the-world' event, and when partitions are numerous, the metadata exchange exceeds session timeouts, triggering immediate subsequent rebalances.",
    "bad_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    RangeAssignor.class.getName());\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"10000\");\n// Lacks static membership and uses eager assignment",
    "solution_desc": "Switch to the CooperativeStickyAssignor to enable Incremental Cooperative Rebalancing. Additionally, implement Static Membership by setting a group.instance.id to prevent rebalances during transient restarts.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\nproperties.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, \"consumer-node-1\");\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");",
    "verification": "Monitor the 'rebalance-latency-avg' and 'rebalance-total' metrics in JMX; confirm that individual pod restarts do not trigger group-wide 'PreparingRebalance' logs.",
    "date": "2026-02-21",
    "id": 1771647834,
    "type": "error"
});