window.onPostDataLoaded({
    "title": "Fixing Istio Envoy Sidecar Memory Bloat",
    "slug": "istio-envoy-memory-bloat-fix",
    "language": "Go",
    "code": "Envoy OOMKilled",
    "tags": [
        "Kubernetes",
        "Infra",
        "Istio",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn Kubernetes clusters with hundreds of services, Istio's Envoy sidecars suffer from memory bloat. By default, Istio pushes the configuration of every service in the mesh to every sidecar. As pods scale up and down (churn), the Envoy XDS cache grows exponentially to store the endpoint data for services the pod will never actually communicate with.</p>",
    "root_cause": "The 'Full Mesh' configuration delivery model where every sidecar receives XDS updates for all services and endpoints in the cluster.",
    "bad_code": "apiVersion: networking.istio.io/v1beta1\nkind: Gateway\n# No Sidecar resource defined for the namespace\n# Envoy defaults to tracking everything in the cluster",
    "solution_desc": "Implement the 'Sidecar' Custom Resource Definition (CRD) to restrict the 'egress' visibility of the sidecars. This limits the configuration to only the namespaces or services the application actually depends on.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: my-app\nspec:\n  egress:\n  - hosts:\n    - \"./*\"\n    - \"istio-system/*\"\n    - \"shared-services/*\"",
    "verification": "Check Envoy memory usage using `kubectl top pod`. Memory consumption should drop from hundreds of MBs to under 50MB in large clusters.",
    "date": "2026-02-23",
    "id": 1771811130,
    "type": "error"
});