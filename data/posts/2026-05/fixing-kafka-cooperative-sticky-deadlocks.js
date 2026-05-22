window.onPostDataLoaded({
    "title": "Fixing Kafka Cooperative Sticky Assignor Deadlocks",
    "slug": "fixing-kafka-cooperative-sticky-deadlocks",
    "language": "Kafka",
    "code": "Consumer Deadlock",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>The CooperativeStickyAssignor in Apache Kafka was introduced to prevent full-stop rebalances by shifting partitions incrementally. However, in high-throughput pipelines, it can trigger infinite rebalance loops or complete deadlocks. When a rebalance begins, a consumer must yield its revoked partitions before acquiring new ones. If the consumer's poll loop is blocked by long-running synchronous database operations or downstream APIs, the consumer fails to commit its offsets and acknowledge the partition revocation, locking up the cooperative state machine.</p>",
    "root_cause": "The cooperative rebalance requires the consumer thread to cycle through its poll loop to complete the revocation handshake. If the user thread blocks inside a message processing function, it cannot execute the background heartbeat/cooperative callbacks. The coordinator waits indefinitely for the revoked partition to be released, stalling the entire consumer group.",
    "bad_code": "while (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // BAD: Blocking synchronous HTTP call in the consumer poll loop\n        // This blocks the consumer from executing cooperative rebalance callbacks.\n        httpClient.sendData(record.value());\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple message ingestion from message processing by offloading the processing tasks to an asynchronous worker thread pool. Additionally, register a ConsumerRebalanceListener that immediately forces a synchronous commit of currently processed offsets and pauses ingestion during partition revocation.",
    "good_code": "consumer.subscribe(Collections.singletonList(\"my-topic\"), new ConsumerRebalanceListener() {\n    @Override\n    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {\n        // Immediately stop accepting new tasks and commit offsets for revoked partitions\n        executor.shutdownAndAwaitTermination(2, TimeUnit.SECONDS);\n        consumer.commitSync();\n    }\n    @Override\n    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {\n        // Re-initialize task executors\n    }\n});\n\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        executor.submit(() -> process(record)); // Decoupled asynchronous handling\n    }\n}",
    "verification": "Check Kafka broker logs for 'Group rebalance timed out' or 'Offset commit failed' warnings. Use JMX monitoring tools to track the `join-rate-metric` and `rebalance-latency-avg` metrics. Rebalances should resolve in under a second even under synthetic message lag.",
    "date": "2026-05-22",
    "id": 1779432061,
    "type": "error"
});