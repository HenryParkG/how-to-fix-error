window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms in Slow Batches",
    "slug": "fixing-kafka-rebalance-storms-slow-batch-processing",
    "language": "Kafka / Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Java",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>When a Kafka consumer fetches a large batch of records, it must process all of them and invoke poll() again before the duration configured in max.poll.interval.ms expires. If processing is slow (e.g., due to database locks or downstream APIs), the consumer exceeds this time limit. The group coordinator assumes the consumer has died, removes it from the group, and triggers a rebalance. When the slow consumer finally finishes and attempts to commit offsets, it encounters a CommitFailedException. The consumer then rejoins the group, triggering another cascade of rebalances across the cluster\u2014often known as a rebalance storm.</p>",
    "root_cause": "The maximum record batch size (max.poll.records) is configured too high relative to the processing rate, or the max.poll.interval.ms threshold is set too low to handle worst-case slow batch execution times.",
    "bad_code": "# High-risk properties causing rebalance storms under slow database processing\nmax.poll.records=5000\nmax.poll.interval.ms=300000\n# If average processing takes 100ms per record, 5000 records require 500s,\n# which far exceeds the 300s (5 min) limit, triggering a rebalance.",
    "solution_desc": "Align max.poll.records and max.poll.interval.ms logically so that worst-case message processing time never exceeds the interval. Alternatively, decouple message fetching from processing by pushing messages to a managed in-memory thread pool, enabling the consumer loop to continuously poll Kafka and send heartbeat signals.",
    "good_code": "# Balanced properties for slow, heavy processing architectures\nmax.poll.records=100\nmax.poll.interval.ms=900000\n# 100 records max. At 100ms per record, total processing is 10s.\n# This is safely below the increased 900s (15 min) polling timeout threshold.",
    "verification": "Observe consumer logs under heavy artificial lag. Verify that rebalance events are absent, commit failures drop to zero, and the consumer group status remains stable in the output of 'kafka-consumer-groups.sh'.",
    "date": "2026-05-28",
    "id": 1779970777,
    "type": "error"
});