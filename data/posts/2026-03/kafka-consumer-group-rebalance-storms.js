window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-group-rebalance-storms",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>A 'Rebalance Storm' occurs in Kafka when a cluster spends more time reassigning partitions than actually processing data. This usually triggers when one consumer is slightly slow, causing the coordinator to think it is dead. This triggers a rebalance, which pauses all consumers, causing more timeouts and a cascading failure loop.</p><p>In dynamic cloud environments, network jitters or GC pauses frequently trigger these storms if the session timeouts are configured too aggressively or if processing logic exceeds the poll interval.</p>",
    "root_cause": "Mismatch between 'max.poll.interval.ms' and actual processing time, combined with 'session.timeout.ms' being too low to handle transient network blips or long Stop-The-World GC events.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"my-app\");\n// Default poll interval is often too short for heavy logic\nprops.put(\"max.poll.interval.ms\", \"300000\"); \nprops.put(\"session.timeout.ms\", \"10000\");",
    "solution_desc": "Implement Static Group Membership to allow consumers to restart with the same ID without triggering a rebalance. Increase the poll interval and session timeouts to provide a buffer for long-running tasks and transient issues.",
    "good_code": "Properties props = new Properties();\nprops.put(\"group.id\", \"my-app\");\n// 1. Enable Static Membership\nprops.put(\"group.instance.id\", \"consumer-1\"); \n// 2. Increase heartbeat and session buffers\nprops.put(\"session.timeout.ms\", \"45000\");\nprops.put(\"heartbeat.interval.ms\", \"15000\");\n// 3. Set poll interval based on max processing time\nprops.put(\"max.poll.interval.ms\", \"600000\");",
    "verification": "Monitor the 'kafka.consumer:type=consumer-coordinator-metrics' for rebalance latency and frequency. Ensure 'join-rate-metrics' stays near zero.",
    "date": "2026-03-20",
    "id": 1773999154,
    "type": "error"
});