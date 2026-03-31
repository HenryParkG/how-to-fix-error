window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-consumer-rebalance-jitter-fix",
    "language": "Java/Kafka",
    "code": "Timeout Jitter",
    "tags": [
        "Java",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kafka consumer groups frequently fall into 'rebalance storms' where members are repeatedly kicked out and rejoined. This usually happens when the heartbeat thread fails to signal liveness to the broker within the <code>session.timeout.ms</code> window. High GC pauses or network jitter can delay these heartbeats. Furthermore, if the processing logic takes longer than <code>max.poll.interval.ms</code>, the consumer proactively leaves the group, triggering a rebalance that stalls the entire partition processing pipeline.</p>",
    "root_cause": "The session timeout is set too low relative to network jitter/GC pauses, or max.poll.interval.ms is too aggressive for the actual processing time of messages.",
    "bad_code": "properties.put(\"session.timeout.ms\", \"10000\");\nproperties.put(\"heartbeat.interval.ms\", \"3000\");\nproperties.put(\"max.poll.interval.ms\", \"300000\");\n// Heavy processing logic follows...",
    "solution_desc": "Increase the session timeout to provide a buffer for jitter and tune the heartbeat interval to be 1/3 of the session timeout. Decouple message processing from the heartbeat by ensuring max.poll.interval.ms covers the worst-case processing time.",
    "good_code": "properties.put(\"session.timeout.ms\", \"45000\");\nproperties.put(\"heartbeat.interval.ms\", \"15000\");\nproperties.put(\"max.poll.interval.ms\", \"600000\");\nproperties.put(\"max.poll.records\", \"100\");",
    "verification": "Monitor the 'Rebalancing' state in Kafka metrics and check for 'Member id ... has failed' logs in the broker.",
    "date": "2026-03-31",
    "id": 1774940590,
    "type": "error"
});