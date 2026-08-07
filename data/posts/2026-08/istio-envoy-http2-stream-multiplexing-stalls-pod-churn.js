window.onPostDataLoaded({
    "title": "Fixing Istio Envoy Proxy HTTP/2 Stalls Under Pod Churn",
    "slug": "istio-envoy-http2-stream-multiplexing-stalls-pod-churn",
    "language": "Kubernetes",
    "code": "Envoy HTTP/2 Stall",
    "tags": [
        "Kubernetes",
        "Docker",
        "Istio",
        "Envoy",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn Kubernetes environments (e.g., frequent auto-scaling or rolling updates), microservices running Istio sidecars often encounter cascading HTTP/2 connection stalls, high tail latencies, and <code>503 Service Unavailable</code> (UC / upstream connection termination) errors.</p><p>By default, Envoy reuses long-lived TCP connections for multiplexing hundreds of HTTP/2 streams to upstream pod endpoints. During rapid pod churn, Kubernetes deletes pod IPs from service endpoints while Envoy is mid-stream on existing HTTP/2 TCP connections. If connection pools lack strict age limits or dynamic health checks fail to notify Envoy promptly, requests continue to multiplex over stale connections that are undergoing asynchronous TCP teardown or GOAWAY frame processing, resulting in head-of-line blocking and request timeouts.</p>",
    "root_cause": "Unbounded HTTP/2 connection reuse combined with missing explicit `max_requests_per_connection` limits in Istio configurations causes Envoy to funnel multiplexed streams into terminating upstream endpoints.",
    "bad_code": "# BUG: Default DestinationRule without dynamic connection pool or drain limits\napiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: payment-service\n  namespace: default\nspec:\n  host: payment-service\n  trafficPolicy:\n    loadBalancer:\n      simple: ROUND_ROBIN\n    # Lacks max_requests_per_connection and aggressive outlier detection",
    "solution_desc": "Configure Istio `DestinationRule` settings to limit upstream connection duration using `maxRequestsPerConnection`. This forces Envoy to close and recreate HTTP/2 connections periodically, preventing multiplexing over stale instances. Combine this with explicit `outlierDetection` (ejection policies) to instantly route around terminating pods.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: payment-service\n  namespace: default\nspec:\n  host: payment-service\n  trafficPolicy:\n    connectionPool:\n      http:\n        http1MaxPendingRequests: 1024\n        maxRequestsPerConnection: 500  # Recycles TCP conn to prevent stale multiplexing\n      tcp:\n        maxConnections: 2048\n    outlierDetection:\n      consecutive5xxErrors: 3\n      interval: 2s\n      baseEjectionTime: 30s\n      maxEjectionPercent: 50",
    "verification": "Check Envoy sidecar stats using `kubectl exec <pod> -c istio-proxy -- pilot-agent request GET stats | grep upstream_cx_destroy_with_active_rq`. Verify that 503 response flags (UC/UO) drop to near zero during rolling deployments.",
    "date": "2026-08-07",
    "id": 1786068520,
    "type": "error"
});