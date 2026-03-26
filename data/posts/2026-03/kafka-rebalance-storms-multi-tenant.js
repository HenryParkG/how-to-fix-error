window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storms-multi-tenant",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput multi-tenant Kafka clusters, 'Rebalance Storms' occur when consumers are repeatedly kicked out of a group, triggering a cascade of reassignments. This is often seen when individual tenant processing logic hits a bottleneck. When the processing time of a single batch exceeds <code>max.poll.interval.ms</code>, the consumer coordinator assumes the consumer has failed. In multi-tenant environments, the overhead of re-syncing many partitions across various tenants causes the metadata overhead to spike, leading to further timeouts and a 'storm' that halts progress.</p>",
    "root_cause": "Processing latency exceeding the poll interval threshold, compounded by high partition counts in multi-tenant schemas that increase rebalance duration.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// Complex multi-tenant logic that occasionally takes 6+ mins\nconsumer.poll(Duration.ofMillis(100));\nprocessTenantData(records);",
    "solution_desc": "Increase `max.poll.interval.ms` to accommodate worst-case processing times and decouple the message fetching from the processing logic using an internal worker thread pool. Use 'Static Group Membership' to prevent rebalances during transient pod restarts.",
    "good_code": "properties.put(\"group.instance.id\", \"consumer-node-1\"); // Static Membership\nproperties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nproperties.put(\"session.timeout.ms\", \"45000\");",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency-avg' metrics in Prometheus; verify that 'rebalance-total' remains stable during peak tenant load.",
    "date": "2026-03-26",
    "id": 1774501223,
    "type": "error"
});