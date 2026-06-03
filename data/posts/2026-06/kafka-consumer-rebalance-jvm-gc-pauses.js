window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms from JVM GC Pauses",
    "slug": "kafka-consumer-rebalance-jvm-gc-pauses",
    "language": "Java",
    "code": "CommitFailedException",
    "tags": [
        "Kafka",
        "JVM",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Kafka consumer groups, heartbeat signals are periodically sent to the broker coordinator to assert consumer liveness. When the JVM hosting the consumer application undergoes a major Garbage Collection (GC) Stop-The-World (STW) pause that exceeds the configured 'session.timeout.ms', the broker marks the consumer as dead. This initiates a group rebalance, forcing partition reassignments. As the JVM resumes and tries to commit its offsets, it hits a CommitFailedException, triggering nested, cascading rebalance storms across the cluster.</p>",
    "root_cause": "The failure occurs because long Stop-The-World pauses in the default Parallel GC block the Kafka consumer heartbeat background threads. The broker coordinator times out waiting for the heartbeat and forces a group rebalance. When the consumer resumes, its assigned partitions have changed, rendering its outstanding offset offsets invalid.",
    "bad_code": "Properties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"payment-processor\");\n// BUG: Tight timeouts with default JVM GC configurations make it vulnerable to STW pauses\nprops.put(\"session.timeout.ms\", \"10000\"); \nprops.put(\"max.poll.interval.ms\", \"30000\");\nprops.put(\"heartbeat.interval.ms\", \"3000\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "solution_desc": "Transition the JVM to a modern low-latency garbage collector like G1GC or ZGC and configure aggressive maximum pause-time parameters. Concurrently, increase 'session.timeout.ms' to provide a buffer against transient GC spikes, and decouple the polling thread from message processing using a dedicated execution worker thread pool.",
    "good_code": "// Ensure the application runs with JVM arguments: -XX:+UseG1GC -XX:MaxGCPauseMillis=20\nProperties props = new Properties();\nprops.put(\"bootstrap.servers\", \"localhost:9092\");\nprops.put(\"group.id\", \"payment-processor\");\n\n// FIX: Mitigate GC latency anomalies using wider thresholds\nprops.put(\"session.timeout.ms\", \"45000\");      // Allow up to 45 seconds of GC/network pause\nprops.put(\"max.poll.interval.ms\", \"300000\");   // Give worker threads 5 minutes to process batch\nprops.put(\"heartbeat.interval.ms\", \"15000\");    // Send heartbeats every 15 seconds (1/3 of session)\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);",
    "verification": "Induce a JVM pause using 'jcmd <pid> GC.run' under active message consumption load. Monitor Kafka Broker logs to confirm that consumer group state remains 'Stable' and no 'CommitFailedException' occurrences are reported in application traces during the simulated GC spikes.",
    "date": "2026-06-03",
    "id": 1780455061,
    "type": "error"
});