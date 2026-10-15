window.onPostDataLoaded({
    "title": "Resolving Istio Envoy HTTP/2 RST_STREAM Storms",
    "slug": "resolving-istio-envoy-http2-rst-stream-storms",
    "language": "Go",
    "code": "HTTP2_ENHANCE_YOUR_CALM",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio mesh communicating via HTTP/2 or gRPC, Envoy sidecars enforce strict controls over stream concurrency via max_concurrent_streams and buffer flow windows. When downstream traffic spikes exceed the upstream service's processing capacity or connection limits, Envoy triggers `RST_STREAM` frames with error codes like `REFUSED_STREAM` or `ENHANCE_YOUR_CALM`.</p><p>As clients receive RST_STREAM, uncoordinated retry storms overwhelm Envoy's circuit breakers. The sidecar connection pool becomes exhausted, leading to `overflow` errors and downstream timeouts (503 Service Unavailable with NC/UO flags).</p>",
    "root_cause": "Mismatched HTTP/2 multiplexing thresholds between upstream DestinationRules and downstream Envoy sidecars cause stream exhaustion, resulting in abrupt connection resets instead of queued backpressure.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: default-broken-limits\nspec:\n  host: payment-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      http:\n        http1MaxPendingRequests: 1\n        maxRequestsPerConnection: 1 # Forces frequent reconnects and multiplex degradation",
    "solution_desc": "Configure DestinationRule connection pool settings to support adequate concurrent HTTP/2 streams (`http2MaxRequestsPerConnection`) and enforce outlier detection and circuit breaking to manage stream exhaustion gracefully.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: payment-service-tuned\nspec:\n  host: payment-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      http:\n        http2MaxRequestsPerConnection: 1024\n        maxRequestsPerConnection: 0 # Unlimited to leverage persistent H2 connections\n        maxPendingRequests: 1000\n      tcp:\n        maxConnections: 2048\n    outlierDetection:\n      consecutive5xxErrors: 3\n      interval: 10s\n      baseEjectionTime: 30s",
    "verification": "Run `istioctl proxy-status` and check Envoy sidecar statistics using `kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/stats | grep -E 'rst_stream|cx_overflow'`. Confirm that `upstream_rq_rx_reset` and `circuit_breakers.default.cx_open` remain at zero under load.",
    "date": "2026-10-15",
    "id": 1792051032,
    "type": "error"
});