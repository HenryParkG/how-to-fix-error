window.onPostDataLoaded({
    "title": "Fixing Envoy OOM From Istio Configuration Bloat",
    "slug": "envoy-sidecar-memory-exhaustion-istio-bloat",
    "language": "Go / YAML",
    "code": "EnvoyOOMKilled",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Kubernetes clusters managed by Istio service mesh, Envoy sidecar proxies are highly susceptible to Out-Of-Memory (OOM) kills. By default, Istio's control plane (Pilot/Istiod) broadcasts configuration updates for *every* service, endpoint, listener, and route in the entire mesh to *every* single Envoy sidecar proxy.</p><p>As the cluster scales to hundreds of microservices and thousands of pods, the configuration state sent via xDS APIs bloats exponentially. The memory footprint of an individual Envoy sidecar can jump from 50MB to several gigabytes just to store routing tables for services it will never call. When Kubernetes resource limits are strictly enforced, this configuration bloat triggers rapid OOM termination of the Envoy proxy, causing cascading network failures and app downtime.</p>",
    "root_cause": "Istio's default wildcard egress configuration scoping, which pushes the global cluster service registry (all endpoints/routes) to every Envoy sidecar, causing excessive memory consumption.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\n  namespace: transactional\nspec:\n  replicas: 3\n  template:\n    metadata:\n      labels:\n        app: payment-service\n    spec:\n      containers:\n      - name: payment-service\n        image: payment:v1.0\n        # BAD: No Istio Sidecar resource defined. \n        # Envoy will import routes and endpoints for all 500+ microservices in the cluster,\n        # exceeding its 256Mi memory limit and getting OOMKilled.",
    "solution_desc": "Implement Istio `Sidecar` Custom Resource Definitions (CRDs) to explicitly restrict the egress scope of the proxies. By defining the namespaces and services a specific workload is allowed to communicate with, you minimize the xDS configuration pushed to that proxy. This slashes Envoy's memory footprint from gigabytes to megabytes, restoring stability and preventing OOM events.",
    "good_code": "apiVersion: networking.istio.io/v1beta1\nkind: Sidecar\nmetadata:\n  name: payment-sidecar-scope\n  namespace: transactional\nspec:\n  workloadSelector:\n    labels:\n      app: payment-service\n  # GOOD: Restrict egress config to only current namespace and shared system services\n  egress:\n  - hosts:\n    - \"./*\" # Allows communication to services in the 'transactional' namespace\n    - \"istio-system/*\" # Allows communication to istio telemetry/system services\n    - \"shared-utilities/db-service.shared-utilities.svc.cluster.local\"",
    "verification": "Apply the Sidecar resource. Check the sidecar memory utilization before and after using: `kubectl top pod -n transactional` or query Envoy's admin endpoint: `kubectl exec -it <pod-name> -c istio-proxy -- curl http://127.0.0.1:15000/stats | grep memory_allocated`. Memory allocation should drop by up to 90%.",
    "date": "2026-06-03",
    "id": 1780492282,
    "type": "error"
});