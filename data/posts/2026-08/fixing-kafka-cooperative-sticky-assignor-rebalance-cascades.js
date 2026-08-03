window.onPostDataLoaded({
    "title": "Fix Kafka Cooperative Sticky Assignor Rebalance Cascades",
    "slug": "fixing-kafka-cooperative-sticky-assignor-rebalance-cascades",
    "language": "Java",
    "code": "RebalanceInProgressException",
    "tags": [
        "Java",
        "Kafka",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>The <code>CooperativeStickyAssignor</code> in Apache Kafka is designed to reduce consumer group rebalance pauses through incremental rebalancing. However, under transient network flaps, short packet loss, or GC pauses exceeding <code>session.timeout.ms</code>, consumer nodes miss heartbeats and are evicted.</p><p>When these evicted nodes quickly rejoin, the iterative protocol triggers consecutive rebalancing rounds. When high partition counts are combined with slow metadata propagation or aggressive <code>max.poll.interval.ms</code>, consumers constantly revoke and re-assign partitions, leading to cascading livelocks and zero throughput.</p>",
    "root_cause": "Misconfigured session timeout, max poll interval, and heartbeat thread priorities combined with aggressive rebalance timeouts causing iterative partition revocation cascades during minor network spikes.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"processing-group\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\n\n// Aggressive timeouts cause rapid eviction during brief network flaps\nprops.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"6000\");\nprops.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, \"2000\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"10000\");",
    "solution_desc": "Increase session.timeout.ms to withstand network jitter, align heartbeat.interval.ms to 1/3 of session timeout, increase max.poll.interval.ms to accommodate processing times, and tune group.min.session.timeout.ms on the broker.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"processing-group\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\n\n// Resilient settings for network flaps and transient pauses\nprops.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\nprops.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, \"15000\");\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"500\");",
    "verification": "Simulate transient network packet drops using iptables or toxiproxy on consumer nodes and observe consumer group state stability via kafka-consumer-groups.sh --describe.",
    "date": "2026-08-03",
    "id": 1785722072,
    "type": "error"
});