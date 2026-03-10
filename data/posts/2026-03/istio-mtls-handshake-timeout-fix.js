window.onPostDataLoaded({
    "title": "Fixing Istio mTLS Handshake Timeouts",
    "slug": "istio-mtls-handshake-timeout-fix",
    "language": "Kubernetes",
    "code": "Timeout",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In geographically distributed service meshes, the latency between Envoy proxies can exceed the default mTLS handshake timeout. When a source proxy initiates a TLS handshake with a destination, it expects a completion within a strict window (often 10s). If the latency is high or the control plane (istiod) is slow to rotate certificates, Envoy terminates the connection before the handshake finishes, resulting in 503 errors or connection resets.</p>",
    "root_cause": "High network RTT between clusters causes the underlying TCP/TLS handshake to exceed the Envoy default handshake_timeout property.",
    "bad_code": "apiVersion: install.istio.io/v1alpha1\nkind: IstioOperator\nspec:\n  meshConfig:\n    # Default values often too low for cross-region\n    accessLogFile: /dev/stdout",
    "solution_desc": "Apply an EnvoyFilter to the ingress or egress gateways (and sidecars) to explicitly increase the transport_socket's handshake_timeout to accommodate the network latency.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: extend-handshake-timeout\nspec:\n  configPatches:\n  - applyTo: NETWORK_FILTER\n    match:\n      listener:\n        filterChain:\n          filter:\n            name: \"envoy.filters.network.http_connection_manager\"\n    patch:\n      operation: MERGE\n      value:\n        typed_config:\n          \"@type\": \"type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\"\n          common_http_protocol_options:\n            max_connection_duration: 30s",
    "verification": "Monitor the 'envoy_cluster_ssl_context_no_certificate' and 'envoy_listener_ssl_handshake_error' metrics in Prometheus for a decrease in failures.",
    "date": "2026-03-10",
    "id": 1773116858,
    "type": "error"
});