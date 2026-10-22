window.onPostDataLoaded({
    "title": "Fix Envoy Memory Exhaustion from High-Churn EDS",
    "slug": "fix-istio-envoy-memory-exhaustion-eds-churn",
    "language": "Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In dynamic Kubernetes clusters characterized by aggressive pod autoscaling, rolling updates, or frequent batch job lifecycles, Istio service mesh proxies (Envoy sidecars) can experience sudden, unbounded memory expansion leading to container <code>OOMKilled</code> termination. By default, Istio's control plane (<code>istiod</code>) broadcasts Endpoint Discovery Service (EDS) updates globally across the mesh unless scoped. Each sidecar receives cluster updates for endpoints it may never communicate with.</p><p>Internally, Envoy allocates memory in its cluster manager and host sets for every endpoint, tracking connection pools, TLS sessions, and health status structures. Under high churn, memory fragmentation in Envoy's underlying memory allocator (typically TCMalloc) compounds with continuous object graph re-creation during State-of-the-World (SotW) xDS pushes. Even after garbage collection, the resident set size (RSS) rarely shrinks back to baseline, causing sidecars on long-running services to fail unpredictably.</p>",
    "root_cause": "Unrestricted mesh-wide EDS push scope combined with State-of-the-World (SotW) xDS processing and default TCMalloc aggressive deallocation thresholds, forcing each sidecar to re-instantiate host structures during every cluster-wide endpoint transition.",
    "bad_code": "apiVersion: install.istio.io/v1alpha1\nkind: IstioOperator\nspec:\n  meshConfig:\n    # Default allows wildcard egress, pushing all mesh endpoints to every proxy\n    outboundTrafficPolicy:\n      mode: ALLOW_ANY\n    defaultConfig:\n      proxyMetadata: {}\n",
    "solution_desc": "Mitigate this issue through three architectural layers: 1) Deploy namespace-scoped Istio `Sidecar` resources to restrict the egress visibility of proxies to strictly needed dependencies; 2) Enable Delta xDS in the Istio control plane to transmit incremental endpoint diffs rather than entire cluster snapshots; 3) Tune Envoy's TCMalloc release rate to aggressively return freed heap memory back to the Linux kernel.",
    "good_code": "apiVersion: networking.istio.io/v1beta1\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: production\nspec:\n  egress:\n  - hosts:\n    - \"./*\"               # Only discover services in current namespace\n    - \"istio-system/*\"    # Discover mesh telemetry/control plane\n    - \"shared-services/*\" # Explicit cross-namespace upstream\n---\napiVersion: install.istio.io/v1alpha1\nkind: IstioOperator\nspec:\n  meshConfig:\n    defaultConfig:\n      proxyMetadata:\n        ISTIO_DELTA_XDS: \"true\"\n        MALLOC_CONF: \"dirty_decay_ms:1000,muzzy_decay_ms:2000\"\n",
    "verification": "Query proxy endpoint count and memory usage using `istioctl proxy-config endpoints <pod-name>` to verify host reduction. Monitor Envoy memory metrics using `kubectl exec <pod-name> -c istio-proxy -- curl -s localhost:15000/stats | grep -E 'server.memory_allocated|cluster_manager.cluster_updated'`.",
    "date": "2026-10-22",
    "id": 1792636422,
    "type": "error"
});