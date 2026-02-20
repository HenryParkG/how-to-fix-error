window.onPostDataLoaded({
    "title": "Fixing gRPC Stream Window Exhaustion in Istio",
    "slug": "grpc-istio-window-exhaustion",
    "language": "Go",
    "code": "StreamStall",
    "tags": [
        "Go",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio service mesh, gRPC communication relies on HTTP/2 flow control. Each stream has a 'window size' (buffer) that limits how much data can be in flight. If a consumer is slow or if Envoy's default buffer settings (usually 64KB) are too small for high-bandwidth streams, the window becomes exhausted. The sender receives a 'Window Update' delay, causing the stream to hang or latency to spike despite low CPU usage.</p>",
    "root_cause": "The mismatch between the application's gRPC InitialWindowSize and Envoy's default `initial_stream_window_size` in the Istio sidecar ingress/egress listeners.",
    "bad_code": "// Default Istio Ingress or Sidecar without tuning\napiVersion: networking.istio.io/v1alpha3\nkind: Gateway\nspec:\n  selector:\n    istio: ingressgateway\n  servers:\n  - port:\n      number: 80\n      name: grpc\n      protocol: GRPC",
    "solution_desc": "Apply an `EnvoyFilter` to increase the HTTP/2 window sizes for the specific workload. This allows more data to be buffered in the sidecar proxy before requiring an ACK from the receiving application, effectively 'fattening the pipe' for high-throughput gRPC streams.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nspec:\n  configPatches:\n  - applyTo: HTTP_PROTOCOL_OPTIONS\n    patch:\n      operation: MERGE\n      value:\n        http2_protocol_options:\n          initial_stream_window_size: 1048576 # 1MB\n          initial_connection_window_size: 1048576",
    "verification": "Check Envoy statistics using `kubectl exec -it [POD] -c istio-proxy -- pilot-agent request GET stats | grep 'http2.pending_send_window'`. A non-zero, stable value indicates healthy flow.",
    "date": "2026-02-20",
    "id": 1771569850,
    "type": "error"
});