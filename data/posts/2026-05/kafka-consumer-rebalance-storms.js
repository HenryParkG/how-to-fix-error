window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Rebalance Storms",
    "slug": "kafka-consumer-rebalance-storms",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Kafka",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kafka rebalance storms occur in high-partition environments when the 'Eager Rebalance' protocol is used. During a rebalance, all consumers in a group stop processing, revoke their partitions, and wait to be reassigned.</p><p>In large clusters, the time taken to reassign thousands of partitions exceeds the <code>max.poll.interval.ms</code>, causing consumers to drop out again and triggering an infinite loop of rebalancing where no work is completed.</p>",
    "root_cause": "The default Eager Rebalance protocol revokes all partitions globally, combined with tight poll intervals in high-latency environments.",
    "bad_code": "partition.assignment.strategy=org.apache.kafka.clients.consumer.RangeAssignor\nsession.timeout.ms=10000\nmax.poll.interval.ms=300000",
    "solution_desc": "Switch to the 'Cooperative Sticky' assignor which implements incremental rebalancing. Only partitions that need to move are revoked. Also, implement Static Membership by providing a unique <code>group.instance.id</code> to prevent rebalances on transient restarts.",
    "good_code": "partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor\ngroup.instance.id=consumer-node-1\nsession.timeout.ms=45000\nmax.poll.interval.ms=600000",
    "verification": "Check Kafka logs for 'Rebalancing' events. With CooperativeSticky, the 'Revoking partitions' log count should drop significantly.",
    "date": "2026-05-18",
    "id": 1779071378,
    "type": "error"
});