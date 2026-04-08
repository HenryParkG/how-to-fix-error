window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Rebalance Storms",
    "slug": "kafka-rebalance-storm-fix",
    "language": "Java / Kafka",
    "code": "Rebalance Storm",
    "tags": [
        "Java",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Kafka rebalance storms occur when consumers in a group repeatedly trigger membership changes, causing the cluster to stop processing while partitions are reassigned. In high-throughput clusters, this usually happens because a consumer takes too long to process a batch, exceeding the <code>max.poll.interval.ms</code>, or due to transient network flakiness triggering <code>session.timeout.ms</code>.</p><p>The result is a 'stop-the-world' effect where consumer throughput drops to zero repeatedly, leading to massive lag spikes.</p>",
    "root_cause": "Consumer processing logic exceeds max.poll.interval.ms, causing the broker to think the consumer has failed, or frequent pod restarts in Kubernetes causing immediate group rebalances.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// If processing logic below takes 6 mins, a rebalance triggers\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        heavyDatabaseOperation(record); // Potential bottleneck\n    }\n}",
    "solution_desc": "Increase max.poll.interval.ms to exceed the worst-case processing time. More importantly, implement 'Static Group Membership' (available since Kafka 2.3) by setting <code>group.instance.id</code>. This allows a consumer to restart and reclaim its partitions without triggering a rebalance, provided it returns within the session timeout.",
    "good_code": "properties.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, \"consumer-node-1\");\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\");\n// Using CooperativeStickyAssignor to minimize partition movement\nproperties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n    CooperativeStickyAssignor.class.getName());",
    "verification": "Monitor 'rebalance-rate-per-hour' in JMX. With static membership, pod restarts should no longer trigger 'Joining Group' logs for other consumers.",
    "date": "2026-04-08",
    "id": 1775624780,
    "type": "error"
});