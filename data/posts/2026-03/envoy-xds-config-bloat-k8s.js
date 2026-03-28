window.onPostDataLoaded({
    "title": "Resolving Envoy xDS Configuration Bloat in K8s",
    "slug": "envoy-xds-config-bloat-k8s",
    "language": "Kubernetes",
    "code": "OOMKilledEnvoy",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Kubernetes clusters, service meshes like Istio or Linkerd use Envoy as a sidecar. By default, every Envoy instance receives the configuration (endpoints, clusters, routes) for every other service in the cluster via the xDS API. As the cluster grows to thousands of services, the Envoy memory footprint (RSS) explodes, leading to OOM kills and high control-plane CPU usage for simple updates.</p>",
    "root_cause": "Unbounded visibility scoping where every Envoy proxy maintains a full graph of the entire mesh network.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: ServiceEntry\nmetadata:\n  name: global-visibility\nspec:\n  # No restrictions on visibility\n  hosts:\n  - \"*\"",
    "solution_desc": "Apply 'Sidecar' resources (in Istio) or equivalent scoping mechanisms to restrict the configuration pushed to specific namespaces. By defining dependencies, Envoy only receives the subsets of the xDS graph it actually needs to communicate with.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Sidecar\nmetadata:\n  name: default\n  namespace: my-app\nspec:\n  egress:\n  - hosts:\n    - \"./*\" # Only talk to services in same namespace\n    - \"istio-system/*\" # And the system services",
    "verification": "Check Envoy memory usage via 'kubectl top pod' and verify config size using 'istioctl proxy-config clusters <pod-name>'.",
    "date": "2026-03-28",
    "id": 1774660718,
    "type": "error"
});