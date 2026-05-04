window.onPostDataLoaded({
    "title": "Fixing Kafka Rebalance Storms in Static Membership",
    "slug": "kafka-static-membership-rebalancing",
    "language": "Kafka",
    "code": "Rebalance Storm",
    "tags": [
        "Java",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kafka 2.3+ introduced Static Membership to prevent unnecessary rebalances when pods restart. However, 'rebalance storms' still occur if 'group.instance.id' is misconfigured or if 'session.timeout.ms' is shorter than the application's initialization time. In Kubernetes, using a hardcoded ID across multiple replicas causes a 'MemberIdConflictException', triggering a cascade of failures across the consumer group.</p>",
    "root_cause": "Duplicate group.instance.id assignments across different pods or session timeouts expiring before the consumer can send a heartbeat during high-load startups.",
    "bad_code": "group.id=my-app-group\n# WRONG: Hardcoded ID in a Deployment with 3 replicas\ngroup.instance.id=static-consumer-1\nsession.timeout.ms=6000",
    "solution_desc": "Inject unique instance IDs using Kubernetes Downward API (pod name) and increase session timeouts to accommodate startup jitter without triggering a rebalance.",
    "good_code": "group.id=my-app-group\n# Correct: Mapping unique Pod Name to Instance ID\ngroup.instance.id=${K8S_POD_NAME}\nsession.timeout.ms=45000\nmax.poll.interval.ms=300000",
    "verification": "Monitor 'kafka_consumergroup_rebalance_rate_total' in Prometheus. A successful configuration will show zero rebalances during rolling restarts.",
    "date": "2026-05-04",
    "id": 1777859929,
    "type": "error"
});