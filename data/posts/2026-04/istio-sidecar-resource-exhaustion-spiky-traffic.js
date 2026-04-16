window.onPostDataLoaded({
    "title": "Mitigating Istio Sidecar Resource Exhaustion",
    "slug": "istio-sidecar-resource-exhaustion-spiky-traffic",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When a Kubernetes cluster scales to hundreds of services, the default Istio configuration pushes the entire cluster's service registry to every Envoy sidecar. Under spiky traffic, the resulting 'XDS' updates cause sidecars to consume massive amounts of CPU and RAM, leading to OOM (Out of Memory) kills and increased latency for application traffic.</p>",
    "root_cause": "The default sidecar configuration lacks scoping, causing Envoy to maintain information about every service and endpoint in the mesh, regardless of whether the specific application needs to communicate with them.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: my-app\nspec:\n  # Missing egress configuration\n  # Sidecar inherits all services in the mesh",
    "solution_desc": "Use the Istio 'Sidecar' resource to explicitly define 'egress' dependencies. By restricting the visibility of services to only those the application needs, the memory footprint of the Envoy proxy is reduced from hundreds of megabytes to just a few dozen.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: restrict-egress\n  namespace: my-app\nspec:\n  egress:\n  - hosts:\n    - \"istio-system/*\"\n    - \"./other-service.my-app.svc.cluster.local\"\n    - \"default/database-service.default.svc.cluster.local\"",
    "verification": "Run 'kubectl top pod -l app=my-app' before and after applying the Sidecar resource. Check 'istioctl proxy-config clusters <pod-name>' to verify that only required clusters are loaded.",
    "date": "2026-04-16",
    "id": 1776304166,
    "type": "error"
});