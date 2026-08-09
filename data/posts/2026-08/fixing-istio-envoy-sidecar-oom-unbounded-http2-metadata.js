window.onPostDataLoaded({
    "title": "Fixing Istio Envoy OOMs from HTTP/2 Metadata",
    "slug": "fixing-istio-envoy-sidecar-oom-unbounded-http2-metadata",
    "language": "Go",
    "code": "Envoy Sidecar OOM",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Istio Envoy sidecar proxies can get terminated by Kubernetes OOMKilled (Exit Code 137) when handling high concurrency gRPC or HTTP/2 streams containing unbounded header metadata. Envoy buffers dynamic HPACK headers and HTTP/2 stream state frames in heap memory per stream, leading to excessive allocation under heavy frame bursts.</p>",
    "root_cause": "Default HTTP2 connection manager protocol settings in Envoy allow unbounded stream header frames and high dynamic table allocations before terminating offending HTTP/2 connections, causing rapid heap exhaustion in constrained sidecar containers.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: unbound-http2-config\n  namespace: istio-system\nspec:\n  workloadSelector:\n    labels:\n      app: api-gateway\n  configPatches: [] # Missing max stream and metadata limits",
    "solution_desc": "Apply an EnvoyFilter configuring strict limits on max_concurrent_streams, max_inbound_priority_frames, and max_consecutive_inbound_frames_with_empty_payload inside Envoy's http2_protocol_options to enforce stream memory bounds.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: limit-http2-metadata-memory\n  namespace: istio-system\nspec:\n  workloadSelector:\n    labels:\n      app: api-gateway\n  configPatches:\n  - applyTo: HTTP_FILTER\n    match:\n      context: SIDECAR_INBOUND\n      listener:\n        filterChain:\n          filter:\n            name: \"envoy.filters.network.http_connection_manager\"\n    patch:\n      type: MERGE\n      value:\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          http2_protocol_options:\n            max_concurrent_streams: 100\n            initial_stream_window_size: 65536\n            max_consecutive_inbound_frames_with_empty_payload: 5",
    "verification": "Run load generation tests using h2load sending large stream metadata payloads; monitor container_memory_working_set_bytes in Prometheus to ensure Envoy memory remains within spec limits without sidecar restarts.",
    "date": "2026-08-09",
    "id": 1786257538,
    "type": "error"
});