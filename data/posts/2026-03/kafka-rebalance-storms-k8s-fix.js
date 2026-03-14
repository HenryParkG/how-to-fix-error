window.onPostDataLoaded({
    "title": "Mitigating Kafka Rebalance Storms in Kubernetes",
    "slug": "kafka-rebalance-storms-k8s-fix",
    "language": "Java / Kafka",
    "code": "Group Rebalance Storm",
    "tags": [
        "Kubernetes",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In massive-scale Kubernetes deployments, transient issues like node pressure or pod restarts trigger Kafka consumer rebalances. In a 'storm' scenario, a single pod restart causes the whole consumer group to stop processing, reassign partitions, and potentially time out again during initialization, leading to a loop of inactivity. This is exacerbated by K8s liveness probes failing during the heavy initialization of a new consumer.</p>",
    "root_cause": "Dynamic membership defaults and tight session timeouts causing cascading failures when pods fluctuate.",
    "bad_code": "consumer.props.put(\"session.timeout.ms\", \"10000\");\n// No group.instance.id set (Dynamic Membership)",
    "solution_desc": "Enable 'Static Membership' by assigning a unique 'group.instance.id' to each consumer (derived from the K8s Pod Name). Increase the 'session.timeout.ms' to allow for brief network hiccups without triggering a rebalance. Use a larger 'max.poll.interval.ms' for heavy processing tasks.",
    "good_code": "properties.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, System.getenv(\"HOSTNAME\"));\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"45000\");\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"600000\");",
    "verification": "Check Kafka logs for 'Preparing to rebalance' vs 'Static member joined' messages. A pod restart should no longer trigger a full group rebalance.",
    "date": "2026-03-14",
    "id": 1773450782,
    "type": "error"
});