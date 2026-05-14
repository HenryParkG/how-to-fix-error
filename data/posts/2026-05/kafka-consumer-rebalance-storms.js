window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>In massive-scale Kafka deployments, a 'rebalance storm' occurs when a group of consumers repeatedly stop and start the rebalancing process. This typically happens when a single consumer fails to poll within the 'max.poll.interval.ms' due to heavy processing or GC pauses. When one consumer leaves, the coordinator triggers a rebalance for the whole group, which increases the load on remaining consumers, causing them to also miss their poll intervals, leading to a cascading failure across the cluster.</p>",
    "root_cause": "The max.poll.interval.ms is set lower than the actual peak processing time of a batch, combined with the lack of Static Membership.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"massive-group\");\n// Default or too low interval for heavy ETL\nprops.put(\"max.poll.interval.ms\", \"300000\"); \nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "solution_desc": "Increase 'max.poll.interval.ms' to exceed the worst-case processing time. More importantly, implement 'Static Membership' by providing a unique 'group.instance.id' to each consumer instance, allowing them to restart without triggering a global rebalance.",
    "good_code": "Properties props = new Properties();\nprops.put(\"group.id\", \"massive-group\");\n// 1. Unique ID for Static Membership\nprops.put(\"group.instance.id\", System.getenv(\"HOSTNAME\"));\n// 2. Increase interval for safety\nprops.put(\"max.poll.interval.ms\", \"900000\");\n// 3. Use Incremental Cooperative Rebalancing\nprops.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Monitor the 'kafka_consumer_group_rebalance_total' metric in Prometheus. Rebalance counts should drop to near-zero during routine rolling restarts.",
    "date": "2026-05-14",
    "id": 1778724848,
    "type": "error"
});