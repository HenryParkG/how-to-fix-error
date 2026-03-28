window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms-fix",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Kafka",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in Kafka when consumers frequently join or leave a group, causing the 'Stop-the-World' effect where no data is processed while partitions are reassigned. In Kubernetes environments, rolling updates or transient network jitters often trigger these storms. Standard dynamic membership requires a consumer to give up its partitions and wait for a new assignment, which is highly inefficient for planned restarts.</p>",
    "root_cause": "The default dynamic membership protocol triggers a global rebalance whenever a consumer heartbeat is missed or a member leaves the group.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-service-group\");\n// Missing group.instance.id leads to dynamic membership\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "solution_desc": "Implement Static Membership by providing a unique 'group.instance.id'. This allows the consumer to restart within the 'session.timeout.ms' window without triggering a rebalance. The broker remembers the partition mapping for that specific instance ID.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-service-group\");\n// Static membership: K8s Pod Name works well as ID\nprops.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, System.getenv(\"HOSTNAME\"));\nprops.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"30000\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Monitor the 'kafka.coordinator.group:type=ConsumerGroup,name=rebalance-count' MBean during a rolling deployment. It should remain near zero.",
    "date": "2026-03-28",
    "id": 1774660717,
    "type": "error"
});