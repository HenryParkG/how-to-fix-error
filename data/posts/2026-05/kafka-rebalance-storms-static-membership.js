window.onPostDataLoaded({
    "title": "Mitigating Kafka Rebalance Storms via Static Membership",
    "slug": "kafka-rebalance-storms-static-membership",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In distributed Kafka environments (like Kubernetes), pod restarts trigger rebalances. In a dynamic membership model, every restart generates a new <code>member.id</code>, forcing the group coordinator to reassign all partitions. This 'rebalance storm' causes significant latency spikes and processing pauses across the entire consumer group.</p>",
    "root_cause": "By default, Kafka consumers are transient. When a consumer leaves, Kafka assumes it's gone forever and reshuffles partitions. During a rolling update, this happens N times for N pods, leading to N! complexity in reassignments.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"my-app\");\n// No instance ID: defaults to dynamic membership\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "solution_desc": "Implement 'Static Group Membership' by providing a unique <code>group.instance.id</code> to each consumer. This allows the consumer to restart and rejoin within the <code>session.timeout.ms</code> window without triggering a rebalance, provided it keeps the same ID.",
    "good_code": "Properties props = new Properties();\nprops.put(\"group.id\", \"my-app\");\n// Static ID based on K8s Pod Name\nprops.put(\"group.instance.id\", System.getenv(\"POD_NAME\"));\nprops.put(\"session.timeout.ms\", \"30000\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Check Kafka broker logs for 'Preparing to rebalance'. With static membership, these entries should only appear if a consumer is down longer than the session timeout.",
    "date": "2026-05-09",
    "id": 1778292099,
    "type": "error"
});