window.onPostDataLoaded({
    "title": "Kafka: Mitigating Recursive Rebalance Storms",
    "slug": "kafka-mitigating-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>A Recursive Rebalance Storm occurs in Apache Kafka when a consumer group enters a state where the rebalance process itself takes longer than the configured <code>max.poll.interval.ms</code> or <code>rebalance.timeout.ms</code>. This causes the group coordinator to mark the consumer as dead, triggering a new rebalance before the previous one finished.</p><p>This feedback loop prevents any actual message processing, as consumers spend 100% of their time performing the join-sync-handshake cycle. This is often triggered by heavy initialization logic or slow cleanup in PartitionRevocation listeners during high-load periods.</p>",
    "root_cause": "Synchronous blocking logic inside the 'onPartitionsRevoked' listener or long-running message processing that exceeds the poll interval, coupled with the default Eager Rebalance protocol.",
    "bad_code": "properties.put(ConsumerConfig.GROUP_ID_CONFIG, \"my-group\");\n// Default eager assignor and low timeout\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); \n\nconsumer.subscribe(Collections.singletonList(\"topic\"), new ConsumerRebalanceListener() {\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // BUG: Blocking I/O or DB commit that takes > 5 mins\n        commitToExternalSystem(partitions);\n    }\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {}\n});",
    "solution_desc": "Switch to the Cooperative Sticky Assignor to enable Incremental Rebalancing, which doesn't stop the world. Additionally, decouple the heavy processing from the poll loop and increase the poll interval to provide sufficient headroom for processing spikes.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n               CooperativeStickyAssignor.class.getName());\nproperties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"900000\"); // 15 mins\n\nconsumer.subscribe(Collections.singletonList(\"topic\"), new ConsumerRebalanceListener() {\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // Offload or use non-blocking status updates\n        triggerAsyncGracefulShutdown(partitions);\n    }\n});",
    "verification": "Monitor the 'join-rate' and 'rebalance-latency' metrics in JMX. A stable group will show a burst of activity followed by a flat zero for rebalance rates.",
    "date": "2026-04-27",
    "id": 1777254938,
    "type": "error"
});