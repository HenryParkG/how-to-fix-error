window.onPostDataLoaded({
    "title": "Fix Envoy Latency Spikes from Circuit Breaker Contention",
    "slug": "fix-envoy-latency-spikes-istio-circuit-breaker",
    "language": "C++ / Istio",
    "code": "WORKER_THREAD_CONTENTION",
    "tags": [
        "Kubernetes",
        "Docker",
        "Istio",
        "Envoy",
        "Error Fix"
    ],
    "analysis": "<p>Istio service mesh sidecars running Envoy proxy can experience extreme tail latency spikes under high concurrent load when circuit breaking parameters (such as `max_connections` or `max_pending_requests`) are heavily contended across worker threads. Envoy assigns downstream connections across multiple worker threads using an event-driven architecture. When circuit breaker counters are modified continuously by thousands of concurrent requests, cross-thread atomic synchronization locks and mutex contention on shared cluster metrics create severe execution stalls inside Envoy's worker event loops.</p>",
    "root_cause": "Extreme lock contention on shared global atomic counters during circuit breaking evaluations across Envoy worker threads during connection spikes.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: high-concurrency-service\nnamespace: production\nspec:\n  host: payment-service\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 10\n      http:\n        http1MaxPendingRequests: 1\n        maxRequestsPerConnection: 1\n    outlierDetection:\n      consecutive5xxErrors: 1\n      interval: 1s\n      baseEjectionTime: 3min\n      maxEjectionPercent: 100",
    "solution_desc": "Configure dynamic connection pooling settings, widen circuit breaking limits to realistic concurrency tiers, enable Envoy per-worker metrics, and avoid aggressive globally-locked circuit breaker thresholds that trigger lock contention across event loops.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: high-concurrency-service\nnamespace: production\nspec:\n  host: payment-service\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n      http:\n        http1MaxPendingRequests: 100\n        maxRequestsPerConnection: 128\n        h2MaxConcurrentStreams: 1024\n    outlierDetection:\n      consecutive5xxErrors: 5\n      interval: 10s\n      baseEjectionTime: 30s\n      maxEjectionPercent: 50",
    "verification": "Monitor Envoy stats endpoint via `kubectl exec <pod> -c istio-proxy -- curl localhost:15000/stats | grep circuit_breakers`. Verify that `ejection_active` and `rq_open` lock stalls disappear and tail latency (p99) stabilizes under load tests.",
    "date": "2026-08-02",
    "id": 1785649668,
    "type": "error"
});