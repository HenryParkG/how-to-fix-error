window.onPostDataLoaded({
    "title": "Debugging Zombie Consumer Fencing in Kafka",
    "slug": "kafka-zombie-consumer-fencing",
    "language": "Kafka",
    "code": "FencedInstanceIdException",
    "tags": [
        "Java",
        "Backend",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Static membership in Kafka (introduced in KIP-345) allows consumers to retain their partition assignments after a restart without triggering a rebalance. However, a 'zombie' scenario occurs when a consumer process hangs and a new one starts with the same <code>group.instance.id</code>. The broker increments the join leader epoch, and when the old consumer recovers, its attempts to commit offsets or send heartbeats result in fencing.</p>",
    "root_cause": "Reusing 'group.instance.id' across multiple active or overlapping consumer instances, leading the Broker to invalidate the older epoch.",
    "bad_code": "properties.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, \"consumer-1\");\nproperties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, \"10000\");\n// If consumer-1 restarts slowly, the broker fences the old instance.",
    "solution_desc": "Implement robust exception handling for FencedInstanceConfigException and adjust the session.timeout.ms to be long enough to cover typical GC pauses or short restarts, but short enough to detect genuine failures.",
    "good_code": "try {\n    consumer.commitSync();\n} catch (FencedInstanceIdException e) {\n    log.error(\"Consumer was fenced. Shutting down to prevent zombie processing.\");\n    System.exit(1);\n} catch (CommitFailedException e) {\n    // Handle normal commit failures\n}",
    "verification": "Monitor the 'consumer-fenced-instances' metric in JMX and verify logs for 'Static member with group.instance.id fenced' messages.",
    "date": "2026-03-24",
    "id": 1774335237,
    "type": "error"
});