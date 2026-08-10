window.onPostDataLoaded({
    "title": "Fixing gRPC Connection Thrashing Driven by MAX_CONNECTION_AGE",
    "slug": "grpc-connection-thrashing-http2-max-connection-age",
    "language": "Go",
    "code": "HTTP2_GOAWAY_THRASH",
    "tags": [
        "Go",
        "Kubernetes",
        "gRPC",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Under heavy microservice traffic behind Kubernetes load balancers, client applications experience periodic latency spikes, CPU spikes, and transient 503 unavailable errors. Observability dashboards reveal thousands of new TCP connections being established every minute, destroying long-lived HTTP/2 connection reuse benefits.</p><p>This churn occurs because server-side MAX_CONNECTION_AGE settings trigger sudden HTTP/2 GOAWAY frames across all active instances simultaneously, causing all clients to initiate concurrent TLS handshakes and connection renegotiations.</p>",
    "root_cause": "MAX_CONNECTION_AGE configured without connection jitter and with an insufficiently short MAX_CONNECTION_AGE_GRACE forces synchronized HTTP/2 GOAWAY connection closures across all backend nodes, triggering a thundering herd reconnection pattern on gRPC clients.",
    "bad_code": "// Server side configuration without connection age jitter\nparams := keepalive.ServerParameters{\n    MaxConnectionAge:      10 * time.Minute,\n    MaxConnectionAgeGrace: 5 * time.Second, // Grace period too short\n    Time:                  2 * time.Hour,\n}\ns := grpc.NewServer(grpc.KeepaliveParams(params))",
    "solution_desc": "Introduce randomized jitter on MaxConnectionAge parameters and expand MaxConnectionAgeGrace to allow client-side load balancers to gracefully drain existing inflight RPCs without client-side reconnection stampedes.",
    "good_code": "// Server side with generous grace period and dynamic jitter\nparams := keepalive.ServerParameters{\n    MaxConnectionAge:      15 * time.Minute, // Server side applies random jitter automatically\n    MaxConnectionAgeGrace: 60 * time.Second, // Allow inflight RPC completion\n    Time:                  2 * time.Hour,\n}\ns := grpc.NewServer(\n    grpc.KeepaliveParams(params),\n    grpc.HeaderTableSize(4096),\n)",
    "verification": "Monitor grpc_client_connections_established_total metrics in Prometheus. Verify smooth TCP connection creation rates without synchronized periodic spikes during runtime under sustained load.",
    "date": "2026-08-10",
    "id": 1786345864,
    "type": "error"
});