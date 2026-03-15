window.onPostDataLoaded({
    "title": "Mitigating Kafka Rebalance Storms in Kubernetes",
    "slug": "kafka-rebalance-storms-k8s",
    "language": "Java",
    "code": "ConsumerGroupRebalanceException",
    "tags": [
        "Java",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In dynamic Kubernetes environments, pods are frequently rescheduled, restarted, or scaled. In Kafka, this causes 'Rebalance Storms' where a consumer group repeatedly halts processing to redistribute partitions. During a storm, the time spent rebalancing exceeds the time spent processing data, leading to massive lag spikes and resource exhaustion across the cluster.</p>",
    "root_cause": "Default heartbeat and session timeouts are too short for K8s pod startup times, combined with dynamic member IDs causing Kafka to treat every restart as a new consumer joining.",
    "bad_code": "properties.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-service\");\n// Default settings lead to churn\n// session.timeout.ms = 10000 (too low for K8s restarts)\n// heartbeat.interval.ms = 3000",
    "solution_desc": "Implement Static Membership by setting a unique 'group.instance.id' for each consumer pod (using K8s pod names). Increase the session timeout to allow pods to restart and reconnect without triggering a rebalance. This allows the group coordinator to wait for the specific instance to return rather than immediately reassigning its partitions.",
    "good_code": "properties.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-service\");\n// Use K8s Pod Name as Static ID via env variable\nproperties.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, System.getenv(\"POD_NAME\"));\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 45000);\nproperties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3000);\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000);",
    "verification": "Monitor 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-latency-avg'. It should remain at zero during rolling updates of the consumer deployment.",
    "date": "2026-03-15",
    "id": 1773557118,
    "type": "error"
});