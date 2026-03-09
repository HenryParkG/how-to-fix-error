window.onPostDataLoaded({
    "title": "Resolving Kafka Zombie Fencing Violations",
    "slug": "kafka-zombie-fencing-eos-fix",
    "language": "Java",
    "code": "ProducerFencedException",
    "tags": [
        "Java",
        "Backend",
        "Kafka",
        "Error Fix"
    ],
    "analysis": "<p>Exactly-Once Semantics (EOS) in Kafka relies on a unique `transactional.id`. When a producer instance hangs or undergoes a long GC pause, the Kafka broker may assume it has failed and allow a new instance to start. If the original instance (the 'zombie') wakes up and tries to commit a transaction, it encounters a `ProducerFencedException`. This is a 'fencing' mechanism to ensure only one producer is active for a given ID, preventing data duplication or corruption.</p>",
    "root_cause": "A producer instance attempts to commit a transaction after its Epoch has been incremented by the broker due to a timeout or a new instance starting with the same transactional.id.",
    "bad_code": "properties.put(\"transactional.id\", \"prod-1\");\nKafkaProducer<String, String> producer = new KafkaProducer<>(properties);\nproducer.initTransactions();\ntry {\n    producer.beginTransaction();\n    producer.send(new ProducerRecord<>(\"topic\", \"msg\"));\n    // Long processing pause happens here\n    producer.commitTransaction();\n} catch (Exception e) {\n    producer.abortTransaction();\n}",
    "solution_desc": "Properly handle ProducerFencedException by closing the producer immediately, as it is unrecoverable. Ensure that `transaction.timeout.ms` is tuned to exceed the maximum expected processing time and that each producer instance has a truly unique transactional ID if scaling horizontally.",
    "good_code": "try {\n    producer.beginTransaction();\n    producer.send(record);\n    producer.commitTransaction();\n} catch (ProducerFencedException | OutOfOrderSequenceException | AuthorizationException e) {\n    // These are fatal. Close producer and exit or re-init.\n    producer.close();\n} catch (KafkaException e) {\n    producer.abortTransaction();\n}",
    "verification": "Check Kafka broker logs for 'Epoch bumped' messages and verify that producers do not attempt further writes after a ProducerFencedException.",
    "date": "2026-03-09",
    "id": 1773018968,
    "type": "error"
});