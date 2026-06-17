window.onPostDataLoaded({
    "title": "Mitigating Envoy Sidecar OOMs in Istio Config Bloat",
    "slug": "mitigating-envoy-sidecar-ooms-istio-config-bloat",
    "language": "Kubernetes YAML",
    "code": "Out Of Memory (OOM) Killer",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In an out-of-the-box Istio service mesh deployment, the control plane (istiod) acts aggressively. By default, it broadcasts configuration details of every single service, endpoint, and virtual service in the cluster to every Envoy sidecar proxy. This 'mesh-wide discovery' model works seamlessly for small deployments but breaks down quadratically as the cluster scales to hundreds of microservices.</p><p>As the service registry grows, the memory footprint of the Envoy sidecars climbs linearly with the number of endpoints. Eventually, Envoy sidecar proxies exceed their container memory limits, causing the Linux kernel to trigger the Out-Of-Memory (OOM) killer. This results in pod restarts, cascading microservice outages, and high latency spikes as Envoy rebuilds its configuration state on startup.</p>",
    "root_cause": "The default Istio discovery configuration pushes the entire global service registry to all Envoy sidecars, leading to excessive memory consumption in the proxy container.",
    "bad_code": "# Default deployment relies on global discovery\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: billing-service\nspec:\n  template:\n    metadata:\n      annotations:\n        # No namespace scoping configured, so Envoy caches all 1000+ cluster services\n        sidecar.istio.io/inject: \"true\"",
    "solution_desc": "Apply Istio 'Sidecar' Custom Resource Definitions (CRDs) to strictly limit configuration egress. By specifying exactly which dependencies a namespace or workload requires, you prune unnecessary endpoint configurations from Envoy's memory cache, reducing its footprint from gigabytes to mere megabytes.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default-sidecar-scope\n  namespace: billing\nspec:\n  # Only import services from local namespace and the shared 'istio-system' gateway\n  egress:\n  - hosts:\n    - \"./*\"\n    - \"istio-system/*\"\n    - \"shared-db-namespace/database.shared-db-namespace.svc.cluster.local\"",
    "verification": "Run 'istioctl proxy-config endpoint <pod-name>' to verify that the sidecar only contains the scoped services. Monitor Envoy's memory footprint using Prometheus metrics: 'container_memory_working_set_bytes{container=\"istio-proxy\"}' to ensure memory stability.",
    "date": "2026-06-17",
    "id": 1781664469,
    "type": "error"
});