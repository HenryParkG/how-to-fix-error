window.onPostDataLoaded({
    "title": "Fixing Istio mTLS Handshake Timeouts",
    "slug": "fixing-istio-mtls-handshake-timeouts-cpu-throttling",
    "language": "Go",
    "code": "mTLS Timeout",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When executing under severe CPU throttling on Kubernetes clusters, Istio's sidecar proxy (Envoy) may fail to complete mutual TLS (mTLS) handshakes with upstream peers within its allocated timeout window. When a container exceeds its CFS (Completely Fair Scheduler) CPU quota, the Linux kernel throttles its execution, starving Envoy's worker threads of CPU cycles.</p><p>Cryptographic operations (such as the TLS key exchanges using ECDHE/RSA) are highly compute-intensive. If Envoy is throttled in the middle of a TLS handshake, it cannot process the incoming cryptographic payloads before the client or the server sidecar drops the connection due to a handshake timeout (typically defaulting to 10 or 15 seconds). This results in sporadic `503 Service Unavailable` errors or connection resets on high-throughput microservices during traffic bursts.</p>",
    "root_cause": "Envoy threads are throttled by the Kubernetes CFS quota. This pauses Envoy execution during cryptographic handshakes, causing the handshakes to exceed Envoy's hardcoded or configured transport socket timeout.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: checkout-service\nspec:\n  template:\n    metadata:\n      annotations:\n        # Default Envoy timeouts are too strict under high CPU throttle conditions\n        sidecar.istio.io/proxyCPU: \"100m\"\n    spec:\n      containers:\n      - name: checkout\n        resources:\n          limits:\n            cpu: \"500m\" # Easily throttled under load\n            memory: \"512Mi\"",
    "solution_desc": "To mitigate this, increase the CPU limits to prevent CFS throttling, adjust Envoy's TLS transport socket timeout via an `EnvoyFilter` or `MeshConfig`, and optimize the container runtime CFS quota configurations if possible (such as using the CPU Manager with static policies or increasing the CFS quota period).",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: checkout-service\nspec:\n  template:\n    metadata:\n      annotations:\n        # Allocate dedicated CPU limits to avoid Envoy starvation\n        sidecar.istio.io/proxyCPU: \"1000m\"\n        sidecar.istio.io/proxyCPULimit: \"2000m\"\n    spec:\n      containers:\n      - name: checkout\n        resources:\n          limits:\n            cpu: \"4000m\" # High limit to avoid CFS throttling\n            memory: \"2Gi\"\n---\napiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: extend-mtls-timeout\n  namespace: istio-system\nspec:\n  configPatches:\n  - applyTo: CLUSTER\n    match:\n      context: OUTBOUND\n    patch:\n      operation: MERGE\n      value:\n        # Extend transport socket connect timeout to allow throttled handshakes to complete\n        connect_timeout: 30s",
    "verification": "Monitor the metric `container_cpu_cfs_throttled_periods_total` in Prometheus to verify that CPU throttling has decreased. Additionally, check the Envoy telemetry logs for connection drops with the response flag `UF,URX` (Upstream Connection Failure / Upstream Reset) to ensure that the handshake timeouts have ceased.",
    "date": "2026-07-19",
    "id": 1784439737,
    "type": "error"
});