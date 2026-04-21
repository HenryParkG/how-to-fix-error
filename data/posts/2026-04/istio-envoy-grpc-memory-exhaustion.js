window.onPostDataLoaded({
    "title": "Fixing Istio Envoy Memory Exhaustion in gRPC Streams",
    "slug": "istio-envoy-grpc-memory-exhaustion",
    "language": "Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput gRPC environments, Istio's Envoy sidecar can experience rapid memory growth leading to OOM (Out Of Memory) kills. This occurs when a producer sends data faster than a consumer can process it, causing the Envoy buffer to swell.</p><p>By default, Envoy lacks aggressive circuit breaking for stream-level buffers. When multiple long-lived gRPC streams experience backpressure simultaneously, the cumulative effect of the 'per-connection' and 'per-stream' buffers exceeds the container's memory limit, even if the application logic itself is memory-efficient.</p>",
    "root_cause": "Envoy's default 'per_connection_buffer_limit_bytes' (1MiB) is often too high for clusters with thousands of concurrent gRPC streams. Combined with lack of 'max_concurrent_streams' limits, it leads to unconstrained heap growth.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: grpc-service\nspec:\n  host: grpc-service.default.svc.cluster.local\n  trafficPolicy:\n    # Missing connectionPool settings defaults to \n    # unconstrained buffer allocations per stream.",
    "solution_desc": "Apply a DestinationRule to explicitly constrain the connection pool and use an EnvoyFilter to lower the buffer limits. This forces gRPC flow control (WINDOW_UPDATE) to trigger earlier, slowing down the producer.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: grpc-service\nspec:\n  host: grpc-service.default.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      http:\n        http2MaxRequestsPerConnection: 100\n        maxConcurrentStreams: 10\n--- \n# EnvoyFilter to tune buffer limits\nspec:\n  configPatches:\n  - applyTo: LISTEN_FILTER_CHAINS\n    patch:\n      value:\n        per_connection_buffer_limit_bytes: 32768 # 32KiB",
    "verification": "Monitor 'envoy_server_memory_allocated' Prometheus metrics while running a load test with a slow consumer. Memory should plateau below the threshold.",
    "date": "2026-04-21",
    "id": 1776748846,
    "type": "error"
});