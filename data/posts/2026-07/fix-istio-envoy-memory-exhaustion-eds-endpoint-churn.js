window.onPostDataLoaded({
    "title": "Fix Istio Envoy Memory Exhaustion from EDS Endpoint Churn",
    "slug": "fix-istio-envoy-memory-exhaustion-eds-endpoint-churn",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In dynamic Kubernetes clusters with high pod churn, Istio Pilot continuously streams Endpoint Discovery Service (EDS) updates to sidecar proxies. By default, every Envoy sidecar receives endpoint updates for every service across the entire mesh. High churn causes continuous dynamic dynamic heap allocation in Envoy, resulting in aggressive memory consumption, GC pressure inside Envoy's C++ heap, and ultimate OOMKilled pod evictions.</p>",
    "root_cause": "Unbounded mesh-wide EDS update propagation forcing Envoy sidecars to store unnecessary cluster endpoints in active proxy memory.",
    "bad_code": "# Default deployment without workload scoping\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\n  namespace: payments\n# Missing Istio Sidecar CRD causes discovery of all 5,000+ cluster endpoints",
    "solution_desc": "Introduce namespace-level or workload-level Istio `Sidecar` resources to restrict discovery visibility strictly to declared dependencies, dramatically reducing Envoy memory footprint.",
    "good_code": "apiVersion: networking.istio.io/v1beta1\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: payments\nspec:\n  egress:\n  - hosts:\n    - \"./*\" # Limit endpoint visibility to local namespace\n    - \"istio-system/*\" # Plus core system services",
    "verification": "Check Envoy memory usage using `kubectl top pod` or Prometheus query `envoy_server_memory_allocated` to verify low static memory baseline under churn.",
    "date": "2026-07-28",
    "id": 1785236948,
    "type": "error"
});