window.onPostDataLoaded({
    "title": "Fixing Kafka Consumer Group Rebalance Storms",
    "slug": "fixing-kafka-rebalance-storms",
    "language": "Java",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in large-scale Kafka clusters when consumers frequently leave and rejoin the group. This causes partition revocation across the entire group, stopping all processing (STW) and leading to massive processing lags and resource spikes as the group attempts to re-stabilize.</p>",
    "root_cause": "Standard dynamic membership triggers a global rebalance whenever a consumer heartbeat is missed or a new instance starts, which is exacerbated by long processing times exceeding 'max.poll.interval.ms'.",
    "bad_code": "properties.put(\"group.id\", \"my-group\");\n// Missing static membership configuration\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);",
    "solution_desc": "Implement Static Membership by assigning a unique 'group.instance.id' to each consumer instance. This allows a consumer to restart and rejoin without triggering a rebalance if it returns within the 'session.timeout.ms'.",
    "good_code": "properties.put(\"group.id\", \"my-group\");\nproperties.put(\"group.instance.id\", \"consumer-1\");\nproperties.put(\"session.timeout.ms\", \"30000\");\nKafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);",
    "verification": "Check Kafka broker logs for 'Static member joined' messages and verify that restarting a consumer pod does not trigger 'Preparing to rebalance' in other consumers.",
    "date": "2026-03-22",
    "id": 1774154851,
    "type": "error"
});