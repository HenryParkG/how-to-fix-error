window.onPostDataLoaded({
    "title": "Istio: Fixing Envoy HoL Blocking in gRPC-Web",
    "slug": "istio-envoy-hol-blocking",
    "language": "Kubernetes",
    "code": "HoLBlocking",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When using Istio to manage gRPC-Web traffic, Envoy acts as a translator between HTTP/1.1 (client-side) and HTTP/2 (upstream). Head-of-Line (HoL) blocking occurs when a long-lived gRPC stream (like a notification feed) consumes a connection slot, and the downstream Envoy buffer fills up. Due to default TCP settings and circuit breaker limits, subsequent requests are queued behind the stalled stream, causing significant latency for short-lived RPC calls.</p>",
    "root_cause": "Default Envoy circuit breaker limits on 'max_requests_per_connection' and insufficient 'http2_max_concurrent_streams' settings.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: grpc-service\nspec:\n  host: grpc-service.default.svc.cluster.local\n  # Missing trafficPolicy to handle streaming concurrency",
    "solution_desc": "Tune the DestinationRule trafficPolicy to allow higher concurrency and adjust the connection pool settings to prevent single-stream saturation from blocking the entire connection.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: grpc-service\nspec:\n  host: grpc-service.default.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      http:\n        http2MaxRequestsPerConnection: 1000\n        maxRequestsPerConnection: 100\n        maxConcurrentStreams: 1024",
    "verification": "Check Envoy stats using 'istioctl dashboard envoy' and monitor 'upstream_rq_pending_overflow'.",
    "date": "2026-02-14",
    "id": 1771060973,
    "type": "error"
});