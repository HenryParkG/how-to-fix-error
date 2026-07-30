window.onPostDataLoaded({
    "title": "Fixing Envoy HTTP/2 Window Exhaustion in gRPC Streams",
    "slug": "fix-istio-envoy-http2-window-exhaustion-grpc",
    "language": "Go",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "Go",
        "Kubernetes",
        "AWS",
        "gRPC",
        "Istio",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput asynchronous gRPC streaming workloads deployed in Istio service meshes often experience stream stalls and connection deadlocks. Envoy enforces default HTTP/2 stream and connection flow-control window sizes (typically 64KB).</p><p>When gRPC producers write data streams faster than downstream clients process and return WINDOW_UPDATE frames through sidecar proxies, stream-level flow control credits exhaust completely, causing streams to stall until timeouts trigger HTTP/2 frame resets.</p>",
    "root_cause": "Insufficient HTTP/2 initial stream and connection flow-control window sizes (64KB default) in Istio Envoy proxies for high-throughput gRPC streaming.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: grpc-stream-service\nspec:\n  host: grpc-stream-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      http:\n        http2MaxRequests: 1024\n        # Missing HTTP/2 initial window size settings, defaults to 65535 bytes",
    "solution_desc": "Apply an EnvoyFilter to increase initial_stream_window_size and initial_connection_window_size to 1MB/2MB, allowing sufficient buffer capacity for streaming gRPC payloads across proxy boundaries.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: expand-http2-window-size\n  namespace: istio-system\nspec:\n  configPatches:\n    - applyTo: HTTP_FILTER\n      match:\n        context: SIDECAR_OUTBOUND\n        listener:\n          filterChain:\n            filter:\n              name: \"envoy.filters.network.http_connection_manager\"\n      patch:\n        operation: MERGE\n        value:\n          typed_config:\n            \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n            http2_protocol_options:\n              initial_stream_window_size: 1048576 # 1MB\n              initial_connection_window_size: 2097152 # 2MB",
    "verification": "Inspect applied sidecar proxy configuration using `istioctl proxy-config listeners <pod-name>` and monitor Prometheus metrics `envoy_http2_pending_send_bytes` to confirm zero stream stalls during heavy gRPC load.",
    "date": "2026-07-30",
    "id": 1785409399,
    "type": "error"
});