window.onPostDataLoaded({
    "title": "Mitigating Kafka Zombie Producers via ID Fencing",
    "slug": "kafka-zombie-producer-fencing",
    "language": "Kafka",
    "code": "ProducerFencedException",
    "tags": [
        "Java",
        "Backend",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In Kafka Exactly-Once Semantics (EOS), 'Zombie' producers occur when a producer instance is partitioned from the network and a new instance starts with the same transactional ID. If the old instance returns, it might try to commit a transaction that conflicts with the new instance's work, leading to data duplication or inconsistency.</p>",
    "root_cause": "The lack of a unique, static 'transactional.id' or failing to handle the epoch increment allows multiple producers to interact with the same transaction coordinator simultaneously.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"enable.idempotence\", \"true\");\n// Missing transactional.id or using a random UUID\nprops.put(\"transactional.id\", UUID.randomUUID().toString());\nKafkaProducer<String, String> producer = new KafkaProducer<>(props);",
    "solution_desc": "Assign a stable, unique 'transactional.id' to each producer instance. When a new producer starts with the same ID, Kafka's transaction coordinator increments the 'producer epoch'. Any requests from the old 'zombie' producer (using the old epoch) will be rejected with a ProducerFencedException.",
    "good_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"enable.idempotence\", \"true\");\n// Use a stable ID based on application instance/partition\nprops.put(\"transactional.id\", \"prod-1-partition-A\");\n\nKafkaProducer<String, String> producer = new KafkaProducer<>(props);\ntry {\n    producer.initTransactions();\n} catch (ProducerFencedException e) {\n    // Handle or exit, as this producer is now a zombie\n    producer.close();\n}",
    "verification": "Monitor 'kafka.server:type=TransactionCoordinatorMetrics' for 'FencedTransactionsCount' and verify that only one producer per ID can successfully call 'commitTransaction'.",
    "date": "2026-03-12",
    "id": 1773297759,
    "type": "error"
});