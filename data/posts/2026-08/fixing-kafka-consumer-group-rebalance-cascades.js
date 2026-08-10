window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Cascades",
    "slug": "fixing-kafka-consumer-group-rebalance-cascades",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "Distributed Systems",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer group rebalance cascades occur when long-running records processing exceeds max.poll.interval.ms. The consumer coordinator deems the node dead, kicks it out of the group, and triggers a rebalance. As other consumers pick up the reassigned partitions while still processing their original batches, their workload increases, causing them to exceed max.poll.interval.ms as well, cascading across the entire cluster.</p>",
    "root_cause": "Processing time per record batch exceeds max.poll.interval.ms, causing heartbeats to pause and the coordinator to trigger rebalances repeatedly across active group members.",
    "bad_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processor\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"500\"); // High batch count\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\"); // 5 mins\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    for (ConsumerRecord<String, String> record : records) {\n        // Synchronous heavy task (e.g., REST API call taking 1s per record)\n        processOrder(record.value()); // 500 records * 1s = 500s > 300s timeout!\n    }\n    consumer.commitSync();\n}",
    "solution_desc": "Decouple message fetching from execution processing using a worker thread pool, pause partition consumption dynamically when buffers fill, or reduce max.poll.records to fit within processing bounds.",
    "good_code": "Properties props = new Properties();\nprops.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, \"localhost:9092\");\nprops.put(ConsumerConfig.GROUP_ID_CONFIG, \"order-processor\");\nprops.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, \"50\"); // Reduced batch size\nprops.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, \"300000\");\n\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);\nconsumer.subscribe(Collections.singletonList(\"orders\"));\n\nExecutorService executor = Executors.newFixedThreadPool(10);\n\nwhile (true) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));\n    if (!records.isEmpty()) {\n        List<Future<?>> futures = new ArrayList<>();\n        for (ConsumerRecord<String, String> record : records) {\n            futures.add(executor.submit(() -> processOrder(record.value())));\n        }\n        // Wait for current batch to finish before next poll iteration\n        for (Future<?> future : futures) {\n            future.get();\n        }\n        consumer.commitSync();\n    }\n}",
    "verification": "Monitor `kafka.consumer:type=consumer-coordinator-metrics,client-id=*` metric `rebalance-latency-avg` and ensure `assigned-partitions` remains stable during load spikes.",
    "date": "2026-08-10",
    "id": 1786323618,
    "type": "error"
});