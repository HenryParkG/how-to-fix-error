window.onPostDataLoaded({
    "title": "Mitigating Kafka Sticky Assignor Drift in Scaling",
    "slug": "kafka-sticky-assignor-drift-mitigation",
    "language": "Kafka",
    "code": "AssignorDrift",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>The StickyAssignor in Kafka is designed to preserve partition ownership across rebalances to minimize state movement. However, in dynamic environments like Kubernetes where pods scale frequently, this 'stickiness' can lead to Partition Drift. New consumers joining the group may receive very few partitions, while older consumers remain overloaded.</p><p>Because the assignor prioritizes existing mappings, it fails to reach a global optimum in a single rebalance. Over many scaling events, the partition distribution becomes severely skewed, leading to uneven consumer lag and CPU utilization across the cluster.</p>",
    "root_cause": "The StickyAssignor's heuristic-based balancing logic prioritizes stability over perfect balance, leading to cumulative imbalance in high-churn environments.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n          StickyAssignor.class.getName());",
    "solution_desc": "Switch to the 'CooperativeStickyAssignor'. This assignor uses a two-phase protocol that allows for incremental rebalancing, which effectively balances the workload without the massive 'stop-the-world' impact of older strategies. It is specifically designed to handle dynamic scaling with better distribution.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"kafka:9092\");\n// Use Cooperative strategy for better balance and availability\nprops.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n          CooperativeStickyAssignor.class.getName());",
    "verification": "Monitor the 'records-lag' per consumer in Grafana and verify that partition distribution converges to a balanced state within two rebalance cycles.",
    "date": "2026-04-25",
    "id": 1777093580,
    "type": "error"
});