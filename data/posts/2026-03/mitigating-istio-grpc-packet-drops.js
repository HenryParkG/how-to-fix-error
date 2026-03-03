window.onPostDataLoaded({
    "title": "Mitigating Istio gRPC Out-of-Order Packet Drops",
    "slug": "mitigating-istio-grpc-packet-drops",
    "language": "Go",
    "code": "EnvoyStreamReset",
    "tags": [
        "Kubernetes",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput gRPC streams often experience 'Out-of-Order' packet drops when routed through Istio's Envoy sidecars. This happens because Envoy's default buffer management and the Linux kernel's TCP stack become bottlenecks during multiplexed stream bursts.</p><p>When gRPC frames arrive faster than Envoy can process them across its worker threads, TCP window exhaustion or receive buffer overflows cause packets to be dropped or reordered, triggering stream resets (RST_STREAM) and latency spikes.</p>",
    "root_cause": "Inadequate `per_connection_buffer_limit_bytes` in Envoy and restricted kernel-level TCP memory limits (tcp_rmem/wmem) under high concurrency.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: grpc-service\nspec:\n  host: grpc-service.default.svc.cluster.local\n  # Missing trafficPolicy tuning for high throughput",
    "solution_desc": "Tune the Envoy sidecar resource limits and use a Sidecar resource to increase the concurrency of the worker threads and adjust the HTTP/2 connection buffer sizes via EnvoyFilters.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: tune-grpc-buffer\nspec:\n  configPatches:\n  - applyTo: HTTP_PROTOCOL_OPTIONS\n    match:\n      context: ANY\n    patch:\n      operation: MERGE\n      value:\n        http2_protocol_options:\n          initial_stream_window_size: 6553600\n          initial_connection_window_size: 10485760",
    "verification": "Monitor `envoy_cluster_upstream_rq_rx_reset` metrics and verify packet retransmission rates using `netstat -s | grep retrans`.",
    "date": "2026-03-03",
    "id": 1772500727,
    "type": "error"
});