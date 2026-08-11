window.onPostDataLoaded({
    "title": "Fix Istio Envoy Memory Leaks Under High HTTP/2",
    "slug": "fix-istio-envoy-memory-leaks-under-high-http2",
    "language": "Envoy",
    "code": "EnvoyOOMKilled",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Under high HTTP/2 multiplexed stream volume, Istio sidecar Envoy proxies can exhibit cascading memory growth leading to OOMKilled state in Kubernetes. This occurs when downstream backpressure delays frame flushing, forcing Envoy to keep stream buffer frames in memory without active stream limits.</p>",
    "root_cause": "Unbounded HTTP/2 max_concurrent_streams and overly generous initial window sizes lead to excessive frame buffer allocations per active connection during downstream latency events.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: default-http2-settings\nspec:\n  configPatches:\n  - applyTo: HTTP_FILTER\n    match:\n      context: SIDECAR_OUTBOUND\n    patch:\n      operation: INSERT_BEFORE",
    "solution_desc": "Configure custom EnvoyFilter rules to bound maximum concurrent HTTP/2 streams and reduce flow control window sizes to enforce buffer bounds.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: bind-http2-memory\n  namespace: istio-system\nspec:\n  configPatches:\n  - applyTo: CLUSTER\n    patch:\n      operation: MERGE\n      value:\n        typed_extension_protocol_options:\n          envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n            \"@type\": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\n            explicit_http_config:\n              http2_protocol_options:\n                max_concurrent_streams: 100\n                initial_stream_window_size: 65536\n                initial_connection_window_size: 1048576",
    "verification": "Execute ghz gRPC load tests with high concurrency and observe container_memory_working_set_bytes in Prometheus to confirm Envoy memory stabilization below limit.",
    "date": "2026-08-11",
    "id": 1786430965,
    "type": "error"
});