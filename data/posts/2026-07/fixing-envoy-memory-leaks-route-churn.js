window.onPostDataLoaded({
    "title": "Fixing Envoy Memory Leaks from Route Churn",
    "slug": "fixing-envoy-memory-leaks-route-churn",
    "language": "Go",
    "code": "EnvoyMemoryLeak",
    "tags": [
        "Envoy",
        "Istio",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Istio service meshes, automation or progressive delivery systems (like Argo Rollouts) can cause extreme dynamic configuration churn. When VirtualServices, Gateways, or ServiceEntries are rapidly created, updated, and deleted, the Istio control plane (Istiod) pushes continuous Route Discovery Service (RDS) updates to Envoy proxies. In certain Envoy versions, dynamic route table rebuilds fail to completely free references to older configurations, leading to a steady, linear leak of heap memory that eventually triggers Kubernetes OOM-kills on the sidecars.</p>",
    "root_cause": "Envoy failed to release memory allocations when replacing dynamic route configurations under high RDS churn, which was exacerbated by large numbers of virtual hosts, match expressions, and complex WASM filter chains that held stale pointers in memory.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: wildcard-egress\nspec:\n  egress:\n  - hosts:\n    - \"*/*\" # Subscribes Envoy to all namespaces, pulling global config updates and maximizing RDS churn memory leakage",
    "solution_desc": "Isolate the configuration scope of Envoy sidecars using the Sidecar resource. This prevents proxies from listening to unnecessary configuration changes outside their direct dependency path, limiting configuration churn. Additionally, upgrade Envoy/Istio to versions featuring patched dynamic configuration memory management.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: isolated-egress\n  namespace: payments-prod\nspec:\n  egress:\n  - hosts:\n    - \"./*\"               # Restricts updates to the local namespace\n    - \"istio-system/*\"    # Restricts updates to essential system services",
    "verification": "Monitor the Envoy sidecar container's memory usage via Prometheus metrics by tracking `container_memory_working_set_bytes`. Under simulated high configuration update frequencies, verify that the memory consumption stabilizes (reaches a steady-state ceiling) instead of continually trending upward.",
    "date": "2026-07-21",
    "id": 1784598475,
    "type": "error"
});