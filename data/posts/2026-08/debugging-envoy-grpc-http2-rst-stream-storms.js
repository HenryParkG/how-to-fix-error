window.onPostDataLoaded({
    "title": "Debugging Envoy gRPC HTTP/2 RST_STREAM Storms",
    "slug": "debugging-envoy-grpc-http2-rst-stream-storms",
    "language": "Go",
    "code": "RST_STREAM_STORM",
    "tags": [
        "Go",
        "gRPC",
        "Envoy",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When high-throughput gRPC microservices protected by Envoy sidecar proxies hit internal cluster limiters (such as <code>max_pending_requests</code> or circuit breaker thresholds), Envoy rapidly trips and closes incoming streams. By default, Envoy sends an HTTP/2 <code>RST_STREAM</code> frame with <code>NO_ERROR</code> or <code>REFUSED_STREAM</code> code. If gRPC clients are configured with aggressive retry policies without exponential backoff, this causes a cascading 'RST_STREAM Storm' where thousands of concurrent stream resets overwhelm network interfaces and saturate CPU cycles on both client and sidecar.</p>",
    "root_cause": "Envoy circuit breakers trip and reject active connections instantly with HTTP/2 stream resets. gRPC clients interpret `REFUSED_STREAM` as a transient layer-4 failure and re-issue requests immediately without jitter or delay, escalating into a self-inflicted DDoS attack.",
    "bad_code": "# Buggy Envoy Cluster Configuration lacking circuit breaker backoff and rate limit protections\nstatic_resources:\n  clusters:\n  - name: backend_grpc_service\n    connect_timeout: 0.25s\n    type: STRICT_DNS\n    circuit_breakers:\n      thresholds:\n      - priority: DEFAULT\n        max_connections: 1024\n        max_pending_requests: 10 # Extremely low threshold trips easily\n        max_requests: 1024",
    "solution_desc": "Configure proper local rate-limiting and circuit breaker parameters in Envoy using overload managers and HTTP/2 stream limits. Simultaneously update gRPC client connections to enforce exponential backoff, jitter, and backpressure handling on stream rejection.",
    "good_code": "# Fixed Envoy Cluster with retry backoff and sustained stream limits\nstatic_resources:\n  clusters:\n  - name: backend_grpc_service\n    connect_timeout: 1s\n    type: STRICT_DNS\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\n        explicit_http2_config:\n          max_concurrent_streams: 100\n    circuit_breakers:\n      thresholds:\n      - priority: DEFAULT\n        max_connections: 5000\n        max_pending_requests: 1000\n        max_requests: 5000\n        retry_budget:\n          budget_percent:\n            value: 20.0\n          min_retry_concurrency: 10",
    "verification": "Induce synthetic load exceeding breaker limits. Check Envoy admin stats for `upstream_rq_pending_overflow` and confirm `http2.outbound_rst_stream` counts level off cleanly instead of spiking exponentially.",
    "date": "2026-08-12",
    "id": 1786518536,
    "type": "error"
});