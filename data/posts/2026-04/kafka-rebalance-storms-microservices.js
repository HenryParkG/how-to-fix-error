window.onPostDataLoaded({
    "title": "Resolving Kafka Consumer Group Rebalance Storms",
    "slug": "kafka-rebalance-storms-microservices",
    "language": "Kafka",
    "code": "RebalanceStorm",
    "tags": [
        "Java",
        "Backend",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Rebalance storms occur in massive microservice meshes when consumer group members frequently drop out and rejoin, causing the entire group to pause processing. In high-scale environments, a single slow consumer or a brief network hiccup triggers a rebalance, which increases latency, causing more consumers to timeout, leading to a cascading failure loop known as a 'storm'.</p>",
    "root_cause": "The root cause is usually a combination of 'session.timeout.ms' being too low for the JVM GC pauses and 'max.poll.interval.ms' being too short for the processing time of a single batch.",
    "bad_code": "consumer.props.put(\"session.timeout.ms\", \"10000\");\nconsumer.props.put(\"max.poll.interval.ms\", \"300000\");\nconsumer.props.put(\"heartbeat.interval.ms\", \"3000\");\n// Low session timeout vs long processing triggers false positives",
    "solution_desc": "Switch to 'Static Membership' by defining 'group.instance.id' to allow consumers to restart without triggering rebalances, and tune the poll intervals to exceed maximum possible processing time.",
    "good_code": "consumer.props.put(\"group.instance.id\", \"consumer-vm-01\");\nconsumer.props.put(\"session.timeout.ms\", \"45000\"); \nconsumer.props.put(\"max.poll.interval.ms\", \"600000\");\n// Static membership allows identity persistence across restarts",
    "verification": "Monitor the 'kafka.consumer:type=consumer-coordinator-metrics,name=rebalance-latency-avg' metric; it should stabilize to near zero during rolling deployments.",
    "date": "2026-04-04",
    "id": 1775265607,
    "type": "error"
});