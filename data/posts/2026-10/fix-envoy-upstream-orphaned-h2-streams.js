window.onPostDataLoaded({
    "title": "Fix Envoy Upstream Starvation from Orphaned H2 Streams",
    "slug": "fix-envoy-upstream-orphaned-h2-streams",
    "language": "Envoy",
    "code": "upstream_cx_max_requests",
    "tags": [
        "Go",
        "Kubernetes",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency microservice architectures where Envoy acts as a reverse proxy or service mesh sidecar to gRPC or HTTP/2 backends, upstream connection starvation can manifest under heavy client disconnect rates. When downstream clients abruptly terminate TLS or TCP connections, Envoy must tear down the corresponding upstream multiplexed HTTP/2 streams by emitting an <code>RST_STREAM</code> frame.</p><p>If the upstream cluster configuration lacks aggressive stream cleanup thresholds or uses unbounded idle timeouts with misconfigured HTTP/2 flow-control window settings, the upstream peer may fail to acknowledge or prioritize stream cancellation frames. Consequently, these streams enter an orphaned or half-closed state on the upstream connection, occupying slots in the HTTP/2 concurrent stream limit (often bounded by <code>max_concurrent_streams = 100</code> by default). New requests routed to the upstream host are queued or rejected with <code>503 Service Unavailable</code> and <code>UH</code> (upstream unhealthy) or <code>UO</code> (upstream overflow) response flags.</p>",
    "root_cause": "Downstream cancellations were not rapidly propagating RST_STREAM resets to upstream connections, while upstream connection pools lacked max_requests limits and stream idle timeouts, resulting in saturated max_concurrent_streams limits.",
    "bad_code": "static_resources:\n  clusters:\n  - name: backend_grpc_service\n    connect_timeout: 0.50s\n    type: STRICT_DNS\n    lb_policy: ROUND_ROBIN\n    http2_protocol_options: {}\n    # Default circuit breakers without stream exhaustion guardrails\n    circuit_breakers:\n      thresholds:\n      - priority: DEFAULT\n        max_connections: 1024\n        max_pending_requests: 1024\n    # Missing max_requests_per_connection and stream_idle_timeout",
    "solution_desc": "Set an explicit `stream_idle_timeout` and downstream termination propagation in the HTTP connection manager. In the upstream cluster, configure `max_requests_per_connection` to force periodic socket recycling, tune `max_concurrent_streams`, and enable proactive TCP keepalives to detect stalled connections.",
    "good_code": "static_resources:\n  clusters:\n  - name: backend_grpc_service\n    connect_timeout: 0.25s\n    type: STRICT_DNS\n    lb_policy: ROUND_ROBIN\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\n        explicit_http_config:\n          http2_protocol_options:\n            max_concurrent_streams: 100\n            stream_error_on_invalid_http_message: true\n        common_http_protocol_options:\n          idle_timeout: 30s\n          stream_idle_timeout: 5s\n          max_requests_per_connection: 50000\n    circuit_breakers:\n      thresholds:\n      - priority: DEFAULT\n        max_connections: 500\n        max_requests: 5000\n        max_pending_requests: 100",
    "verification": "Check Envoy statistics via `/stats?filter=cluster.backend_grpc_service.upstream_rq_` and observe that `upstream_rq_rx_reset` and `upstream_cx_overflow` remain flat during client disconnection bursts, while `upstream_rq_pending_overflow` does not increment.",
    "date": "2026-10-24",
    "id": 1792847059,
    "type": "error"
});