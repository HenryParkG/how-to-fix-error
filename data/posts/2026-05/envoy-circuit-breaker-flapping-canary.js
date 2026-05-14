window.onPostDataLoaded({
    "title": "Mitigating Envoy Circuit Breaker Flapping",
    "slug": "envoy-circuit-breaker-flapping-canary",
    "language": "Go",
    "code": "CB_FLAP",
    "tags": [
        "Kubernetes",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Circuit breaker flapping occurs in canary deployments when the new subset (canary) has significantly fewer instances than the production cluster. If global circuit breaker thresholds are applied, even a single failed request or a temporary spike in latency on the small canary group can trigger the breaker, causing it to rapidly open and close (flap).</p>",
    "root_cause": "The use of static, low-threshold outlier detection and circuit breaker limits on subsets with very small instance counts.",
    "bad_code": "thresholds:\n  - priority: DEFAULT\n    max_connections: 1\n    max_pending_requests: 1\noutlier_detection:\n  consecutive_5xx: 5",
    "solution_desc": "Implement dynamic outlier detection with a 'min_health_percent' and adjust thresholds to be relative to the subset size rather than global constants.",
    "good_code": "outlier_detection:\n  consecutive_5xx: 10\n  base_ejection_time: 30s\n  max_ejection_percent: 50\n  # Prevents ejecting if the small canary pool becomes too small\n  min_health_percent: 50 \n  interval: 10s",
    "verification": "Monitor the 'upstream_rq_pending_overflow' and 'outlier_detection.ejections_active' metrics in Envoy.",
    "date": "2026-05-14",
    "id": 1778739394,
    "type": "error"
});