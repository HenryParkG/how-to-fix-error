window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Storms",
    "slug": "fixing-kafka-consumer-rebalance-storms",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Kafka",
        "Java",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalance storms occur when high-throughput processing spikes delay consumer heartbeats. By default, Kafka consumers process fetched records on the same thread that polls the brokers.</p><p>If the processing time of a message batch exceeds <code>max.poll.interval.ms</code>, the consumer coordinator assumes the consumer is dead, kicks it out of the group, and triggers a rebalance. During the rebalance, other consumers halt processing to reassign partitions, resulting in a cascading bottleneck where more consumers fail their poll timers, causing a continuous loop of rebalancing.</p>",
    "root_cause": "The processing duration of fetched message batches exceeds the 'max.poll.interval.ms' limit, triggering automatic consumer expulsion and consecutive group rebalances.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"payment-processor\");\nprops.put(\"max.poll.records\", \"1000\"); // High batch count\nprops.put(\"max.poll.interval.ms\", \"300000\"); // 5 minutes\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"transactions\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    for (ConsumerRecord<String, String> record : records) {\n        // Heavy blocking processing (e.g. external API call with 1000ms latency)\n        processTransactionWithHeavyIOLatency(record);\n    }\n    // Offset committed synchronously after entire batch processing\n    consumer.commitSync();\n}",
    "solution_desc": "Architecturally decouple the polling loop from message processing. Decrease the 'max.poll.records' count, increase 'max.poll.interval.ms' to provide a safety margin, and offload the actual workload to a managed thread pool. Use pause/resume mechanics on the consumer if the thread pool queue saturates.",
    "good_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"payment-processor\");\nprops.put(\"max.poll.records\", \"100\"); // Reduced batch size\nprops.put(\"max.poll.interval.ms\", \"600000\"); // Increased to 10 mins\nprops.put(\"enable.auto.commit\", \"false\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"transactions\"));\nExecutorService executor = Executors.newFixedThreadPool(10);\n\nwhile (active) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));\n    if (!records.isEmpty()) {\n        executor.submit(() -> {\n            for (ConsumerRecord<String, String> record : records) {\n                processTransactionWithHeavyIOLatency(record);\n            }\n            // Commit offset asynchronously after task pool completion\n            consumer.commitAsync();\n        });\n    }\n}",
    "verification": "Monitor JVM consumer metrics via JMX. Track 'join-rate-metric', 'rebalance-latency-avg', and ensure that 'poll-interval-ms' consistently remains well below 'max.poll.interval.ms' under stress testing.",
    "date": "2026-06-10",
    "id": 1781074765,
    "type": "error"
});