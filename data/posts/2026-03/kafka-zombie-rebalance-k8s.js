window.onPostDataLoaded({
    "title": "Mitigating Kafka 'Zombie' Rebalances in Kubernetes",
    "slug": "kafka-zombie-rebalance-k8s",
    "language": "Kafka",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Kubernetes",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes environments, Kafka consumers often fall into a 'zombie' state where they are technically alive but trigger constant group rebalances. This usually occurs when the processing logic takes longer than the max.poll.interval.ms, or when K8s CPU throttling prevents the consumer from sending heartbeats in time.</p>",
    "root_cause": "The consumer heartbeat thread stays alive (keeping the session active), but the main processing thread exceeds max.poll.interval.ms, causing the broker to kick the consumer out of the group while it still thinks it's an owner.",
    "bad_code": "properties.put(\"max.poll.interval.ms\", \"300000\"); // 5 mins\n// Processing logic that occasionally takes 6+ minutes due to K8s CPU throttling\nconsumer.poll(Duration.ofMillis(100));\nheavyProcessing(records);\nconsumer.commitSync();",
    "solution_desc": "Increase max.poll.interval.ms to accommodate peak processing times and ensure Kubernetes resource limits (CPU) are set to avoid throttling. Additionally, implement an internal background worker to decouple record fetching from processing.",
    "good_code": "properties.put(\"max.poll.interval.ms\", \"900000\"); // 15 mins\nproperties.put(\"heartbeat.interval.ms\", \"3000\");\n// Ensure K8s resources: \n// resources: { limits: { cpu: '2' }, requests: { cpu: '1' } }\nconsumer.poll(Duration.ofMillis(100));",
    "verification": "Monitor the 'join-rate' and 'rebalance-total' metrics in Prometheus; a stable consumer group should have zero rebalances after initial startup.",
    "date": "2026-03-10",
    "id": 1773135352,
    "type": "error"
});