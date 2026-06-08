window.onPostDataLoaded({
    "title": "Fix Envoy OOM with High-Churn Headless Services",
    "slug": "fix-envoy-oom-high-churn-headless",
    "language": "Go",
    "code": "Out Of Memory (OOM)",
    "tags": [
        "Kubernetes",
        "Istio",
        "Envoy",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes environments running Istio, service discovery is automatically mapped to all active sidecars. When applications communicate with high-churn headless services (such as large Elasticsearch clusters, highly dynamic stateful sets, or dynamically spawned batch-processing nodes), Envoy constructs endpoints for every single pod IP. Because headless services constantly dynamically allocate and release IP addresses, Envoy's internally held Endpoint Discovery Service (EDS) cache swells continuously. Deprecated configurations fail to aggressively garbage-collect, leading to unbounded memory consumption in the 'istio-proxy' sidecar container, which eventually gets terminated by the Kubernetes OOM-killer.</p>",
    "root_cause": "By default, Istio configuration pushes the entire cluster endpoint mesh topology to every sidecar proxy. When headless services frequently rotate pods, stale endpoint definitions accumulate in the sidecar's memory faster than garbage collection can purge them.",
    "bad_code": "apiVersion: v1\nkind: Service\nmetadata:\n  name: high-churn-worker\n  namespace: data-processing\nspec:\n  clusterIP: None # Headless Service\n  selector:\n    app: worker-node\n# BUG: No Sidecar egress limitations exist. Every pod in the cluster tracks these dynamic worker IP rotations.",
    "solution_desc": "Implement an Istio 'Sidecar' configuration resource to strictly limit the scope of endpoint discovery. By scoping sidecar egress configurations to only the local namespace or explicit external dependencies, Envoy stops tracking high-churn namespaces that it has no operational need to communicate with.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: isolate-high-churn-egress\n  namespace: web-frontend\nspec:\n  workloadSelector:\n    labels:\n      app: gateway-frontend\n  egress:\n  - hosts:\n    - \"./*\" # Only pull routing details for services within the frontend namespace\n    - \"istio-system/*\" # Required for Istio control plane connectivity",
    "verification": "Deploy the Sidecar resource and monitor the Envoy memory footprint via Prometheus metrics querying 'envoy_server_memory_allocated_bytes' while executing simulated scaling updates on the headless service.",
    "date": "2026-06-08",
    "id": 1780903446,
    "type": "error"
});