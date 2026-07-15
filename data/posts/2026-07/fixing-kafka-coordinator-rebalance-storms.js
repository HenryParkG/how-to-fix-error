window.onPostDataLoaded({
    "title": "Fixing Kafka Coordinator Rebalance Storms",
    "slug": "fixing-kafka-coordinator-rebalance-storms",
    "language": "Kafka",
    "code": "Rebalance Storm",
    "tags": [
        "Kafka",
        "Java",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Kafka dynamic topologies can experience continuous rebalancing (rebalance storms) when consumers dynamically join or leave group networks. During a rebalance, partition assignments are suspended, disrupting message consumption. In large-scale clusters, these frequent rebalances cascade, preventing the system from ever recovering or making progress on consumer processing.</p>",
    "root_cause": "Rebalance storms occur because consumer heartbeats timeout (due to heavy processing blocking the poll loop beyond 'max.poll.interval.ms' or long GC pauses) or because of transient network partitions, causing the Group Coordinator to mark healthy nodes as dead.",
    "bad_code": "# Default vulnerable consumer configurations\nmax.poll.interval.ms = 300000 # 5 minutes\nsession.timeout.ms = 10000     # 10 seconds\nheartbeat.interval.ms = 3000   # 3 seconds\npartition.assignment.strategy = org.apache.kafka.clients.consumer.RangeAssignor",
    "solution_desc": "Architecturally mitigate rebalance storms by increasing the `max.poll.interval.ms` configuration, implementing the Cooperative Sticky Assignor (which does incremental cooperative rebalances rather than full stop-the-world rebalances), and offloading the actual message processing to an asynchronous worker thread pool instead of holding up the poll thread.",
    "good_code": "# Tuned stable configurations\nmax.poll.interval.ms = 900000 # Increase processing leeway to 15 minutes\nsession.timeout.ms = 45000     # Increase session timeout\nheartbeat.interval.ms = 15000   # Keep heartbeat under 1/3 of session timeout\npartition.assignment.strategy = org.apache.kafka.clients.consumer.CooperativeStickyAssignor",
    "verification": "Check consumer logs during deployment or network fluctuations. Verify that 'CooperativeStickyAssignor' is active. You should see partition reassignment occur seamlessly without stopping untouched partitions, drastically decreasing rebalance duration in metrics dashboards.",
    "date": "2026-07-15",
    "id": 1784112156,
    "type": "error"
});