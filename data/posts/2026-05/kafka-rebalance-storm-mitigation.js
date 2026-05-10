window.onPostDataLoaded({
    "title": "Mitigating Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storm-mitigation",
    "language": "Kafka",
    "code": "GroupRebalance",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Kafka deployments, a 'rebalance storm' occurs when a single consumer failure triggers a cascade of reassignments across the entire group. This stops processing for all consumers (Stop-the-World) while partitions are shuffled. In high-churn environments or networks with transient latency, default settings often trigger these rebalances too aggressively. This leads to a feedback loop where slow consumers cause rebalances, and rebalances make consumers even slower due to initialization overhead, eventually crashing the system throughput.</p>",
    "root_cause": "Aggressive session timeouts and the use of the Eager Rebalance protocol (Range/RoundRobin assignors) which revokes all partitions before re-assigning them.",
    "bad_code": "partition.assignment.strategy=org.apache.kafka.clients.consumer.RangeAssignor\nsession.timeout.ms=10000\nmax.poll.interval.ms=300000\n# No static membership configured",
    "solution_desc": "Switch to Cooperative Sticky Assignors to allow non-affected partitions to keep processing during a rebalance, and implement Static Membership using 'group.instance.id' to allow transient restarts without triggering a rebalance.",
    "good_code": "partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor\ngroup.instance.id=consumer-node-1-unique-id\nsession.timeout.ms=45000\nmax.poll.interval.ms=600000",
    "verification": "Monitor the 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-latency-avg' metric; it should drop significantly after switching to Cooperative Sticky assignment.",
    "date": "2026-05-10",
    "id": 1778399868,
    "type": "error"
});