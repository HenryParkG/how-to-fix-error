window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storm-fix",
    "language": "Java",
    "code": "GROUP_REBALANCE_STORM",
    "tags": [
        "Java",
        "Kafka",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in large Kafka clusters when a single consumer failure or network jitter triggers a cascade of rebalances. During a rebalance, consumers stop fetching data (the 'stop-the-world' effect), which can lead to massive lag spikes and resource exhaustion as the group struggles to stabilize.</p>",
    "root_cause": "Default eager rebalancing protocols revoke all partitions from all members, coupled with short session timeouts or long processing times exceeding 'max.poll.interval.ms'.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"group.id\", \"massive-scale-group\");\n// Default eager strategy causes full revokes\nprops.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.RangeAssignor\");",
    "solution_desc": "Switch to the 'CooperativeStickyAssignor' to enable Incremental Cooperative Rebalancing. This allows consumers to keep their partitions during a rebalance unless they specifically need to be migrated. Also, implement Static Membership by setting a 'group.instance.id' to avoid rebalances on transient consumer restarts.",
    "good_code": "Properties props = new Properties();\nprops.put(\"group.instance.id\", \"consumer-1-unique-id\");\nprops.put(\"partition.assignment.strategy\", \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");\nprops.put(\"session.timeout.ms\", \"45000\");",
    "verification": "Check Kafka logs for 'Rebalance' events and verify that 'partitions revoked' count is minimized during consumer restarts.",
    "date": "2026-05-16",
    "id": 1778897052,
    "type": "error"
});