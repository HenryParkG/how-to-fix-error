window.onPostDataLoaded({
    "title": "Fixing Istio Envoy Resets Under HTTP/2 Exhaustion",
    "slug": "fixing-istio-envoy-resets-http2-stream-exhaustion",
    "language": "Kubernetes",
    "code": "ERR_HTTP2_SERVER_REFUSED_STREAM",
    "tags": [
        "Istio",
        "Envoy",
        "Service Mesh",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput microservice architectures running on Istio, workloads heavy on gRPC or multiplexed HTTP/2 traffic communicate through Envoy sidecars. Under sudden load spikes, a upstream service may receive thousands of concurrent multiplexed requests over a small set of persistent TCP connections.</p><p>If the number of active HTTP/2 streams per connection surpasses Envoy's configured limit (`max_concurrent_streams`), Envoy immediately rejects new incoming streams by returning `HTTP/2 RST_STREAM` frames with error code `REFUSED_STREAM`. If client services misinterpret these stream resets as general transport failures and execute aggressive un-hedged retries, it triggers a cascading thundering herd effect across the mesh, degrading cluster latency and crashing sidecar proxies.</p>",
    "root_cause": "Envoy's default `max_concurrent_streams` threshold (100) is exceeded under dense gRPC multiplexing, causing immediate local downstream stream resets and triggering unbounded client retry cascades.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-service-rule\nSpec:\n  host: backend-service\n  trafficPolicy:\n    connectionPool:\n      http:\n        # BUG: Low max_concurrent_streams with no circuit breaker overflow handling\n        http2MaxRequests: 100\n        maxRequestsPerConnection: 10",
    "solution_desc": "Increase `http2MaxRequests` (translating to Envoy's max concurrent streams) in the DestinationRule, configure HTTP/2 stream keepalives, and apply proper circuit breaker thresholds alongside backoff policies to prevent reset cascades.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-service-rule\nSpec:\n  host: backend-service\n  trafficPolicy:\n    connectionPool:\n      http:\n        http2MaxRequests: 1024\n        maxPendingRequests: 500\n        maxRequestsPerConnection: 1024\n    outlierDetection:\n      consecutive5xxErrors:\n        Interval: 10s\n        baseEjectionTime: 30s\n        maxEjectionPercent: 50",
    "verification": "Run a gRPC benchmark tool (such as `ghz` or `fortio`) configured with high concurrency (>500 streams/conn). Monitor Envoy prometheus metrics `envoy_http_downstream_rq_rx_reset` and `envoy_cluster_upstream_rq_pending_overflow` to ensure zero refused streams.",
    "date": "2026-08-04",
    "id": 1785831697,
    "type": "error"
});