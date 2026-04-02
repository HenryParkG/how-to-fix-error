window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Rebalance Storms in Large Streams",
    "slug": "kafka-rebalance-storm-solution",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur when a Kafka cluster spends more time reassigning partitions than actually processing data. In large-scale stateful streams, a single consumer failing a heartbeat triggers a global stop-the-world event. As the group rebalances, the high overhead of state restoration (like RocksDB state in Kafka Streams) causes more consumers to time out, leading to a recursive loop of rebalances.</p>",
    "root_cause": "The primary cause is usually processing time exceeding the 'max.poll.interval.ms' or a 'session.timeout.ms' that is too aggressive for the network latency and garbage collection pauses occurring during state restoration.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"large-state-app\");\n// Default settings often fail under heavy state load\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins is often not enough for state recovery\nprops.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.RangeAssignor\");",
    "solution_desc": "Switch to the CooperativeStickyAssignor and tune the poll intervals. Cooperative rebalancing allows consumers to keep their existing partitions during a rebalance, only revoking the specific partitions that need to move. This prevents the 'stop-the-world' effect and massive state reloads.",
    "good_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\n// Enable Cooperative Rebalancing\nprops.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\n// Increase interval to allow long state recovery without triggering rebalance\nprops.put(\"max.poll.interval.ms\", \"900000\"); \nprops.put(\"session.timeout.ms\", \"45000\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Check Kafka broker logs for 'Preparing to rebalance' frequency and monitor the 'join-rate' and 'sync-rate' metrics in JMX; they should drop significantly after applying sticky assignment.",
    "date": "2026-04-02",
    "id": 1775092980,
    "type": "error"
});