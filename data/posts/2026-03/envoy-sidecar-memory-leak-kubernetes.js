window.onPostDataLoaded({
    "title": "Eliminating Envoy Sidecar Memory Leaks in K8s",
    "slug": "envoy-sidecar-memory-leak-kubernetes",
    "language": "Kubernetes",
    "code": "HeapFragmentation",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn Kubernetes environments, where pods are frequently created and destroyed, Envoy sidecars (common in Istio or Linkerd) can exhibit significant memory growth. This is often misidentified as a leak but is frequently caused by 'Control Plane Bloat' or heap fragmentation.</p><p>As the service discovery (EDS/CDS) constantly pushes updates for new endpoints, Envoy's memory allocator (TCMalloc) might hold onto memory blocks, or the internal metadata cache for deleted endpoints might not be cleared immediately, leading to OOMKills on the sidecar container.</p>",
    "root_cause": "Aggressive XDS updates combined with high endpoint churn causing heap fragmentation and stale metadata retention in Envoy's process space.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nspec:\n  # Missing workloadSelector or egress capture leads to global config bloat\n  egress:\n  - hosts:\n    - \"*/*\"",
    "solution_desc": "Implement scoped Sidecar resources to limit the amount of configuration Envoy receives, and tune the concurrency and memory allocation settings of the proxy via annotations.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nspec:\n  workloadSelector:\n    labels:\n      app: my-app\n  egress:\n  - hosts:\n    - \"istio-system/*\"\n    - \"./my-namespace/*\"\n# Also tune: sidecar.istio.io/proxyCPU: \"100m\"",
    "verification": "Check Envoy admin interface ':15000/stats/prometheus' for 'cluster_manager.update_merge_cancelled' and 'server.memory_heap_size'.",
    "date": "2026-03-21",
    "id": 1774085040,
    "type": "error"
});