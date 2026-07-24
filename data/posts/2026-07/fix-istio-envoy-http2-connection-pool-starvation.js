window.onPostDataLoaded({
    "title": "Fix Istio Envoy Proxy HTTP/2 Pool Starvation",
    "slug": "fix-istio-envoy-http2-connection-pool-starvation",
    "language": "Kubernetes",
    "code": "503 Service Unavailable",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Istio",
        "Error Fix"
    ],
    "analysis": "<p>When high-throughput services deployed within an Istio service mesh communicate over HTTP/2, client Envoy sidecars aggregate request streams across persistent TCP connections. If request bursts exceed Envoy's configured multiplexing stream thresholds, connections exhaust available pool capacity, emitting <code>503 Service Unavailable</code> responses with the flag <code>downstream_cx_overflow</code> or <code>UO</code> (Upstream Overflow).</p>",
    "root_cause": "By default, Envoy enforces conservative limits on concurrent HTTP/2 streams (`max_concurrent_streams: 100`) per TCP connection. Under heavy load, single-connection pooling leads to head-of-line blocking and connection starvation because Envoy fails to open new upstream TCP sockets before the stream capacity ceiling is breached.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: api-service-lb\nnamespace: production\nspec:\n  host: api-service\n  trafficPolicy:\n    connectionPool:\n      http:\n        http1MaxPendingRequests: 100\n        maxRequestsPerConnection: 100 # Too low for high-throughput HTTP/2",
    "solution_desc": "Apply an Istio `DestinationRule` setting explicit HTTP/2 connection pool limits. Expand `http2MaxRequests` and tune circuit breaking settings using `outlierDetection` so Envoy dynamically creates parallel TCP connections when stream utilization spikes.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: api-service-lb\nnamespace: production\nspec:\n  host: api-service\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n      http:\n        http2MaxRequests: 10000\n        maxRequestsPerConnection: 1000\n    outlierDetection:\n      consecutive5xxErrors: 3\n      interval: 10s\n      baseEjectionTime: 30s",
    "verification": "Inspect Envoy stats on client sidecars using `kubectl exec <pod-name> -c istio-proxy -- curl localhost:15000/stats | grep upstream_cx_overflow`. Ensure the value remains `0` during high-concurrency load testing.",
    "date": "2026-07-24",
    "id": 1784890447,
    "type": "error"
});