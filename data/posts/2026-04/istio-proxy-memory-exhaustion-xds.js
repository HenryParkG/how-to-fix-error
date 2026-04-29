window.onPostDataLoaded({
    "title": "Istio Proxy Memory Exhaustion from XDS Cardinality",
    "slug": "istio-proxy-memory-exhaustion-xds",
    "language": "Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Istio's control plane (istiod) pushes configuration to every Envoy proxy in the mesh via XDS APIs. By default, every proxy receives information about every other service in the cluster. As the number of services and pods grows, the configuration size grows quadratically (N^2), leading to Envoy sidecars consuming gigabytes of RAM and eventually hitting OOM limits.</p>",
    "root_cause": "Global configuration visibility in large-scale service meshes causing high cardinality in the Envoy configuration dump.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: istio-config\nspec:\n  # Default sidecar with no egress restrictions\n  # allows visibility into all services in the mesh",
    "solution_desc": "Implement scoped 'Sidecar' resources to restrict the configuration pushed to specific namespaces, only allowing visibility to necessary dependencies.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: restrict-egress\n  namespace: my-app\nspec:\n  egress:\n  - hosts:\n    - \"./*\"\n    - \"istio-system/*\"\n    - \"other-namespace/required-service.svc.cluster.local\"",
    "verification": "Execute `istioctl proxy-config clusters <pod-name>` to verify that the number of clusters tracked by Envoy has significantly decreased.",
    "date": "2026-04-29",
    "id": 1777459622,
    "type": "error"
});