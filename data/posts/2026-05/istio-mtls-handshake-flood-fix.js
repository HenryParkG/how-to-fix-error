window.onPostDataLoaded({
    "title": "Fix Istio Sidecar Resource Exhaustion",
    "slug": "istio-mtls-handshake-flood-fix",
    "language": "Kubernetes",
    "code": "ResourceExhaustion",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale service meshes, 'mTLS Handshake Floods' occur when a service with high churn or rapid scaling triggers thousands of simultaneous TLS handshakes. Each handshake consumes CPU for cryptographic verification and memory for buffer management in the Envoy sidecar. Without proper limits, the sidecar hits OOM (Out Of Memory) or triggers CPU throttling, breaking the data plane.</p>",
    "root_cause": "Missing downstream connection limits and lack of Envoy 'Overload Manager' configuration to shed load during memory pressure.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: default-config\nspec:\n  host: \"*\"\n  # Missing connectionPool and outlierDetection limits",
    "solution_desc": "Apply an EnvoyFilter to configure the Overload Manager and set a maximum limit on concurrent mTLS connections via a DestinationRule. This forces the sidecar to reject new handshakes before it exhausts system resources.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nspec:\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n      http:\n        http2MaxRequests: 1024",
    "verification": "Use 'istioctl proxy-config' to verify the overload manager is active and run a load test using 'fortio' to simulate connection spikes while monitoring memory usage.",
    "date": "2026-05-07",
    "id": 1778119265,
    "type": "error"
});