window.onPostDataLoaded({
    "title": "Stopping Kafka Rebalance Storms in Kubernetes",
    "slug": "kafka-rebalance-storms-k8s",
    "language": "Java",
    "code": "ConsumerRebalanceException",
    "tags": [
        "Java",
        "Kubernetes",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>In dynamic Kubernetes environments, Horizontal Pod Autoscaling (HPA) frequently triggers the addition or removal of pods. In standard Kafka configurations, this causes a 'stop-the-world' event where all consumers in a group stop processing to reassess partition ownership. As the cluster scales, these frequent rebalances lead to 'rebalance storms'\u2014a state where the group spends more time rebalancing than processing data, leading to massive lag spikes and resource exhaustion.</p>",
    "root_cause": "The default 'Eager Rebalance' protocol revokes all partitions before reassignment, combined with default 'session.timeout.ms' being too low for K8s pod termination grace periods.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"kafka:9092\");\nprops.put(\"group.id\", \"my-app\");\n// Default eager assignor is used implicitly\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "solution_desc": "Switch to the CooperativeStickyAssignor to allow incremental rebalancing, where only moving partitions are paused. Additionally, adjust session timeouts to exceed K8s termination grace periods.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 45000);\nprops.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 15000);\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Monitor 'kafka_consumergroup_rebalance_rate_total' and 'sum(kafka_log_lag)' in Prometheus. The rebalance rate should drop significantly during HPA events.",
    "date": "2026-04-23",
    "id": 1776929018,
    "type": "error"
});