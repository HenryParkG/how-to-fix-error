window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms under High Lag",
    "slug": "fixing-kafka-rebalance-storms-commit-timeouts",
    "language": "Kafka",
    "code": "ConsumerRebalanceException",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When a Kafka consumer group encounters sudden message surges or extreme upstream processing latency, consumers may take longer to process a fetched batch than the maximum time window allowed between poll cycles. When this occurs, the broker's Group Coordinator assumes the consumer has failed, evicts it, and triggers a dynamic partition rebalance. This rebalance halts processing and redistributes partitions, creating a cascading failure cycle known as a rebalance storm.</p>",
    "root_cause": "The processing duration of the records returned by a single consumer poll exceeds the 'max.poll.interval.ms' limit, causing the broker coordinator to flag the consumer as dead.",
    "bad_code": "# Buggy: Large batch fetch size combined with low poll interval limit\nbootstrap.servers=kafka:9092\ngroup.id=order-processor\nmax.poll.interval.ms=300000\nmax.poll.records=5000",
    "solution_desc": "Increase the 'max.poll.interval.ms' to match maximum expected latency spikes and drastically reduce 'max.poll.records' to ensure each partition consumer loop completes within the safe time window.",
    "good_code": "# Optimized: Small batches with defensive, highly permissive poll timeout\nbootstrap.servers=kafka:9092\ngroup.id=order-processor\nmax.poll.interval.ms=900000\nmax.poll.records=150",
    "verification": "Verify by running the consumer under synthetic lag tests using 'kafka-producer-perf-test.sh'. Monitor JVM logs for 'Revoking partitions' transitions and verify zero unexpected rebalances.",
    "date": "2026-06-07",
    "id": 1780830232,
    "type": "error"
});