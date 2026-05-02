window.onPostDataLoaded({
    "title": "Eliminating Kafka Rebalance Storms in Static Clusters",
    "slug": "kafka-static-membership-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Kafka",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer groups in containerized environments (like Kubernetes) often suffer from 'rebalance storms.' This happens when a pod restarts, causing Kafka to immediately trigger a rebalance across all members. This results in significant downtime as the entire group stops processing to redistribute partitions. Static membership allows a consumer to retain its ID and assigned partitions across restarts, provided it returns within a configured timeout.</p>",
    "root_cause": "The default dynamic membership triggers a rebalance as soon as a member leaves the group (SIGTERM) or the session timeout expires, because every new connection is treated as a brand new consumer.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"my-app\");\n// Missing group.instance.id leads to dynamic membership\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "solution_desc": "Implement Static Membership by assigning a unique <code>group.instance.id</code> to each consumer instance (e.g., using the Pod Name) and increasing the <code>session.timeout.ms</code> to exceed the typical restart time of the service.",
    "good_code": "Properties props = new Properties();\nprops.put(\"group.id\", \"my-app\");\n// Use stable pod name as instance ID\nprops.put(\"group.instance.id\", System.getenv(\"HOSTNAME\")); \nprops.put(\"session.timeout.ms\", \"30000\"); // 30s grace period\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Observe the 'Group Coordinator' logs in Kafka during a rolling restart. You should see 'Static member joined' messages without the 'Preparing to rebalance' log entry for the entire group.",
    "date": "2026-05-02",
    "id": 1777706414,
    "type": "error"
});