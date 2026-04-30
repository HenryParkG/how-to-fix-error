window.onPostDataLoaded({
    "title": "Resolving Kafka Rebalance Storms in K8s",
    "slug": "kafka-k8s-rebalance-storm-fix",
    "language": "Go",
    "code": "Rebalance Storm",
    "tags": [
        "Kubernetes",
        "Kafka",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalance storms occur in Kubernetes when pods are frequently restarted or rescheduled, causing the entire consumer group to stop processing while partitions are reassigned. In dynamic K8s clusters, this is often triggered by the 'Stop-the-world' nature of the default Eager Rebalance protocol.</p><p>When a pod undergoes a rolling update, it leaves the group, triggers a rebalance, joins back, and triggers another. In large groups, this 'storm' results in significant latency spikes and processing lags as the cluster spends more time rebalancing than actually consuming messages.</p>",
    "root_cause": "The use of volatile Pod IPs and the Eager Rebalance protocol combined with low session.timeout.ms settings.",
    "bad_code": "consumer_config: \n  session.timeout.ms: 10000\n  heartbeat.interval.ms: 3000\n  # Default eager rebalance protocol used\n  partition.assignment.strategy: [range]",
    "solution_desc": "Switch to 'Static Group Membership' by assigning a fixed <code>group.instance.id</code> (e.g., using the Pod Name from K8s downward API). Additionally, implement the 'Cooperative Sticky' rebalance protocol to allow consumers to keep their partitions during a rebalance, only shifting those that are absolutely necessary.",
    "good_code": "consumer_config:\n  group.instance.id: ${HOSTNAME} # K8s Pod Name\n  session.timeout.ms: 45000\n  partition.assignment.strategy: [cooperative-sticky]\n  # This prevents rebalances if pod restarts within 45s",
    "verification": "Perform a K8s deployment rollout and monitor the 'kafka_consumer_group_rebalancing_count' metric. It should stay near zero during the rolling update.",
    "date": "2026-04-30",
    "id": 1777536318,
    "type": "error"
});