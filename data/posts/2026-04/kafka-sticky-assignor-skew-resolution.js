window.onPostDataLoaded({
    "title": "Resolving Kafka Sticky Assignor Skew in Consumer Groups",
    "slug": "kafka-sticky-assignor-skew-resolution",
    "language": "Kafka",
    "code": "Partition Skew",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>The StickyAssignor in Apache Kafka is designed to minimize partition movement during rebalances while maintaining balance. However, in high-throughput environments with frequent consumer departures or rolling restarts, the 'stickiness' can lead to severe skew. This happens because the assignor prioritizes existing assignments over perfect distribution. Over time, some consumers end up with significantly more partitions than others, leading to increased consumer lag on specific nodes while others remain idle.</p>",
    "root_cause": "The assignor fails to perform global rebalancing when members join/leave, instead performing incremental adjustments that accumulate imbalance over multiple generations.",
    "bad_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n  StickyAssignor.class.getName());\n// Results in: Consumer A (10 partitions), Consumer B (2 partitions)",
    "solution_desc": "Migrate to the CooperativeStickyAssignor which supports incremental cooperative rebalancing and better handles distribution logic, or implement a custom monitor to trigger a full rebalance when skew exceeds a threshold.",
    "good_code": "properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, \n  \"org.apache.kafka.clients.consumer.CooperativeStickyAssignor\");",
    "verification": "Monitor the 'records-lag-max' and 'assigned-partitions' metrics via JMX to ensure standard deviation across consumers is within 10%.",
    "date": "2026-04-06",
    "id": 1775469649,
    "type": "error"
});