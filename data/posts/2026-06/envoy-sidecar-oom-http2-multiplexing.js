window.onPostDataLoaded({
    "title": "Fixing Envoy Sidecar OOM under HTTP/2 Multiplexing",
    "slug": "envoy-sidecar-oom-http2-multiplexing",
    "language": "Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Under high-concurrency environments, Istio's Envoy sidecar proxies can experience sudden memory spikes leading to OOMKilled events. This issue is prominent when using HTTP/2 or gRPC, which support high stream multiplexing over a single TCP connection. When downstream clients open thousands of concurrent streams, Envoy dynamically allocates buffers to track each stream's state, metadata, and data windows.</p><p>By default, Envoy has highly permissive ceilings for connection buffer sizes and concurrent streams. If downstream requests back up\u2014due to slow upstream responses, high latency, or network bottlenecks\u2014the memory consumption of these buffered streams escalates rapidly. The memory footprint of the active stream descriptors, combined with read/write buffer windows, easily exceeds standard sidecar container limits (e.g., 1GB or 2GB), triggering the Linux kernel's Out-Of-Memory killer.</p>",
    "root_cause": "The default configuration allows an unlimited or excessively high number of concurrent HTTP/2 streams and large stream/connection window sizes, leading to unbound buffer memory allocation inside Envoy during times of upstream degradation.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: default-h2-settings\n  namespace: istio-system\nspec:\n  configPatches:\n    # BUG: No limits applied to max concurrent streams or window sizes\n    # Envoy default allows up to 2147483647 concurrent streams per connection\n    - applyTo: HTTP_CONNECTION_MANAGER\n      match:\n        context: SIDECAR_INBOUND\n      patch:\n        operation: MERGE\n        value:\n          http_protocol_options:\n            accept_http_10: true",
    "solution_desc": "Apply an EnvoyFilter to configure explicit limit parameters for HTTP/2 protocol options. Specifically, restrict 'max_concurrent_streams' to a reasonable value (e.g., 100 to 256) and lower the 'initial_stream_window_size' and 'initial_connection_window_size' from default multi-megabyte settings down to 64KiB to control buffer growth.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: limit-h2-multiplexing\n  namespace: istio-system\nspec:\n  configPatches:\n    - applyTo: HTTP_CONNECTION_MANAGER\n      match:\n        context: SIDECAR_INBOUND\n      patch:\n        operation: MERGE\n        value:\n          http2_protocol_options:\n            max_concurrent_streams: 128\n            initial_stream_window_size: 65536\n            initial_connection_window_size: 1048576\n    - applyTo: HTTP_CONNECTION_MANAGER\n      match:\n        context: SIDECAR_OUTBOUND\n      patch:\n        operation: MERGE\n        value:\n          http2_protocol_options:\n            max_concurrent_streams: 128\n            initial_stream_window_size: 65536\n            initial_connection_window_size: 1048576",
    "verification": "Generate heavy HTTP/2 or gRPC concurrent traffic against the target workload using a tool like 'ghz' or 'h2load'. Monitor sidecar memory utilization with Prometheus metrics: `sum(container_memory_working_set_bytes{container=\"istio-proxy\"}) by (pod)`. Ensure memory footprint remains flat and stable under peak multiplexed loads.",
    "date": "2026-06-06",
    "id": 1780743000,
    "type": "error"
});