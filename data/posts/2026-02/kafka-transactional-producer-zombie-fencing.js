window.onPostDataLoaded({
    "title": "Resolving Kafka Transactional Producer 'Zombie' Fencing",
    "slug": "kafka-transactional-producer-zombie-fencing",
    "language": "Java / Kafka",
    "code": "ProducerFencedException",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Kafka's Exactly-Once Semantics (EOS) rely on the <code>transactional.id</code> to identify producers. A 'Zombie' producer scenario occurs when a producer is partitioned from the cluster, a new producer starts with the same ID, and the original producer attempts to commit a transaction after the partition heals. Kafka fences the older producer by incrementing the producer epoch, resulting in a <code>ProducerFencedException</code>. If not handled, this leads to data inconsistency or application crashes during recovery cycles.</p>",
    "root_cause": "Multiple producer instances sharing the same 'transactional.id' simultaneously, or long GC pauses causing the broker to expire the producer session and increment the epoch.",
    "bad_code": "properties.put(\"transactional.id\", \"static-id-123\");\nKafkaProducer<String, String> producer = new KafkaProducer<>(properties);\ntry {\n    producer.beginTransaction();\n    producer.send(record);\n    producer.commitTransaction();\n} catch (Exception e) {\n    // Generic handling fails to address fencing\n    log.error(\"Error\", e);\n}",
    "solution_desc": "Ensure <code>transactional.id</code> is unique per application instance (e.g., using hostname or pod UID). Catch <code>ProducerFencedException</code> specifically to gracefully shut down the 'zombie' instance, as it can no longer safely participate in transactions.",
    "good_code": "properties.put(\"transactional.id\", System.getenv(\"HOSTNAME\") + \"-tx-id\");\nproducer.initTransactions();\ntry {\n    producer.beginTransaction();\n    producer.send(record);\n    producer.commitTransaction();\n} catch (ProducerFencedException | OutOfOrderSequenceException | AuthorizationException e) {\n    producer.close(); // Irrecoverable; must close and terminate\n} catch (KafkaException e) {\n    producer.abortTransaction(); // Recoverable\n}",
    "verification": "Simulate a network partition and verify that the fenced producer logs the specific exception and terminates rather than retrying indefinitely.",
    "date": "2026-02-22",
    "id": 1771752201,
    "type": "error"
});