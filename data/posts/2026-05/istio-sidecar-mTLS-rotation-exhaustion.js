window.onPostDataLoaded({
    "title": "Resolving Istio Sidecar Resource Exhaustion",
    "slug": "istio-sidecar-mTLS-rotation-exhaustion",
    "language": "Kubernetes",
    "code": "EnvoyOOM",
    "tags": [
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Istio performs massive mTLS certificate rotations across a large mesh, the Pilot (istiod) pushes Secret Discovery Service (SDS) updates to all sidecars. In clusters with thousands of services, the XDS delivery overhead can cause Envoy sidecar memory to spike. If the sidecar isn't scoped, it receives updates for every service in the cluster, not just its dependencies, leading to OOM kills during high-churn rotations.</p>",
    "root_cause": "Envoy sidecars by default listen to updates for all services in the mesh, causing memory linear to the total number of services and secrets during rotation events.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: istio-system\nspec:\n  # Missing egress scope, tracks everything in mesh\n  egress:\n  - hosts:\n    - \"*/*\"",
    "solution_desc": "Implement fine-grained 'Sidecar' resources using namespace scoping and specific workload selectors to limit the configuration (and thus the SDS updates) each proxy receives.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: localized-sidecar\n  namespace: my-app\nspec:\n  workloadSelector:\n    labels:\n      app: my-service\n  egress:\n  - hosts:\n    - \"./*\" # Only services in current namespace\n    - \"istio-system/*\"",
    "verification": "Check Envoy memory usage via 'kubectl top pod' during a certificate rotation and verify config size with 'istioctl proxy-config clusters <pod-name>'.",
    "date": "2026-05-04",
    "id": 1777892219,
    "type": "error"
});