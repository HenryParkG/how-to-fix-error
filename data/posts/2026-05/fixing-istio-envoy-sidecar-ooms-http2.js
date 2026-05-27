window.onPostDataLoaded({
    "title": "Fixing Envoy Sidecar OOMs under HTTP/2 Multiplexing",
    "slug": "fixing-istio-envoy-sidecar-ooms-http2",
    "language": "Go",
    "code": "Envoy OOM",
    "tags": [
        "Kubernetes",
        "Istio",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput service meshes managed by Istio, downstream clients frequently pool and multiplex thousands of HTTP/2 streams over a single TCP connection to sidecar proxies. When upstream services encounter performance degradation or experience backpressure, they slow down their consumption of incoming frames.</p><p>By default, Envoy's HTTP/2 configuration may allow overly generous initial stream and connection flow-control windows. When heavy payloads are multiplexed over thousands of concurrent streams, Envoy allocates significant buffer space per stream. The combination of slow upstream services and high concurrency causes memory consumption in the Envoy process to skyrocket, quickly violating Kubernetes memory limits and triggering the Linux OOM (Out Of Memory) killer.</p>",
    "root_cause": "Unbounded initial stream and connection-level flow control windows coupled with high concurrent stream limits in HTTP/2 settings, resulting in massive heap memory overhead under upstream backpressure.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: unsafe-h2-settings\n  namespace: istio-system\nspec:\n  configPatches:\n  - applyTo: HTTP_FILTER\n    match:\n      context: SIDECAR_INBOUND\n    patch:\n      operation: MERGE\n      value:\n        # Missing limit configurations or keeping defaults which allow \n        # unbounded concurrent streams and huge buffer sizes under stress.",
    "solution_desc": "Create an EnvoyFilter targeting the ingress and egress listeners to limit the maximum concurrent HTTP/2 streams and reduce the initial stream and connection window sizes. By keeping these boundaries conservative (e.g., 64KB for stream windows), Envoy enforces flow control backpressure back to downstream clients before sidecar memory limits are exceeded.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: secure-h2-flow-control\n  namespace: istio-system\nspec:\n  configPatches:\n  - applyTo: NETWORK_FILTER\n    match:\n      context: SIDECAR_INBOUND\n      listener:\n        filterChain:\n          filter:\n            name: \"envoy.filters.network.http_connection_manager\"\n    patch:\n      operation: MERGE\n      value:\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          http2_protocol_options:\n            max_concurrent_streams: 100\n            initial_stream_window_size: 65536\n            initial_connection_window_size: 1048576",
    "verification": "Deploy the EnvoyFilter, run high-concurrency performance tests using 'h2load' with maximum stream multiplexing, and monitor Envoy memory usage via Prometheus metrics (specifically tracking container_memory_working_set_bytes) to ensure memory consumption remains stable.",
    "date": "2026-05-27",
    "id": 1779864956,
    "type": "error"
});