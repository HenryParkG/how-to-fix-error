window.onPostDataLoaded({
    "title": "Fixing Istio Envoy Sidecar Resource Exhaustion",
    "slug": "istio-envoy-sidecar-oom-fix",
    "language": "Go",
    "code": "ENVOY_OOM_EXIT",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In large multicluster service meshes, every Envoy sidecar, by default, receives configuration updates for every service and endpoint in the entire mesh via the xDS protocol. As the number of clusters grows, the memory footprint of the Envoy process scales linearly, eventually leading to OOM (Out Of Memory) kills on sidecar containers even if the application itself is idling.</p>",
    "root_cause": "Unrestricted xDS discovery scope in large-scale multicluster meshes leading to massive configuration payloads (CDS/EDS).",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: production\nspec:\n  # Missing egress configuration: defaults to global discovery\n  workloadSelector:\n    labels:\n      app: my-app",
    "solution_desc": "Implement the Istio 'Sidecar' resource to explicitly limit the egress discovery scope. Only import services that the specific workload actually needs to communicate with, reducing configuration overhead by orders of magnitude.",
    "good_code": "apiVersion: networking.istio.io/v1beta1\nkind: Sidecar\nmetadata:\n  name: localized-discovery\nspec:\n  egress:\n  - hosts:\n    - \"./*\" # Current namespace\n    - \"istio-system/*\"\n    - \"shared-services/*.svc.cluster.local\"",
    "verification": "Run 'istioctl proxy-config clusters <pod-name>' to verify the reduced list of endpoints and monitor memory usage in Grafana.",
    "date": "2026-02-17",
    "id": 1771321166,
    "type": "error"
});