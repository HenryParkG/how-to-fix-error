window.onPostDataLoaded({
    "title": "Debugging Envoy Proxy Memory Leaks in Istio EDS",
    "slug": "istio-envoy-eds-memory-leak",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>High-churn Kubernetes environments (where pods are frequently created/destroyed) put immense pressure on Istio's Endpoint Discovery Service (EDS). Envoy proxies may exhibit memory leaks when the control plane (Istiod) sends a high frequency of xDS updates. If the proxy's internal cluster manager doesn't properly purge stale metadata or if tcmalloc fails to return memory to the OS fast enough, the sidecar will eventually hit its Cgroup limit and be OOMKilled.</p>",
    "root_cause": "Heap fragmentation in tcmalloc combined with a backlog of 'Cluster-Load-Assignment' updates that keep stale endpoint objects referenced in the heap.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nspec:\n  # Default settings in high-churn clusters\n  egress:\n  - hosts:\n    - \"*/*\"",
    "solution_desc": "Limit the scope of service discovery using Sidecar resources to reduce xDS payload size and configure the Envoy concurrency and memory limits to encourage more aggressive garbage collection.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\nspec:\n  egress:\n  - hosts:\n    - \"./*\" # Only discover services in the same namespace\n    - \"istio-system/*\"\n---\n# Adjusting Proxy concurrency in MeshConfig\nmeshConfig:\n  proxyMetadata:\n    # Force tcmalloc to release memory more aggressively\n    MALLOC_CONF: \"dirty_decay_ms:1000,muzzy_decay_ms:1000\"",
    "verification": "Monitor 'envoy_server_memory_allocated' Prometheus metric after applying namespace isolation to ensure a flat memory sawtooth pattern.",
    "date": "2026-04-27",
    "id": 1777277262,
    "type": "error"
});