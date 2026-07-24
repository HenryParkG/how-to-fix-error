window.onPostDataLoaded({
    "title": "Fixing Kafka Cooperative Sticky Rebalance Storms",
    "slug": "fixing-kafka-cooperative-sticky-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Under high consumer lag, consumers processing large batches can exceed <code>max.poll.interval.ms</code>. Although the Cooperative Sticky Assignor avoids full 'stop-the-world' pauses by revoking only assigned partitions incrementally, delayed processing threads still trigger consumer group ejects. This causes persistent cascaded rebalancing cycles ('rebalance storms') where consumers continually join and leave, preventing partition consumption from catching up.</p>",
    "root_cause": "Long message processing times exceed max.poll.interval.ms, causing the consumer coordinator to consider the consumer dead and initiate repeated cooperative rebalances while high lag persists.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"high-lag-group\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 minutes\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"10000\"); // Too high for lag catch-up",
    "solution_desc": "To stop the rebalance storm, decrease `max.poll.records` to ensure processing finishes within the timeout window, scale up `max.poll.interval.ms` safely, or offload heavy records to an asynchronous worker pool while manually managing poll loops.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"high-lag-group\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, CooperativeStickyAssignor.class.getName());\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\"); // 15 minutes\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"500\"); // Reduced batch size",
    "verification": "Monitor JMX metrics `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` for `rebalance-latency-avg` and `rebalance-rate-per-hour` to confirm group stability during catch-up.",
    "date": "2026-07-24",
    "id": 1784857775,
    "type": "error"
});