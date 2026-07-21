window.onPostDataLoaded({
    "title": "Fixing Kubernetes IPVS Resets During Scale-Down",
    "slug": "fix-kubernetes-ipvs-resets-scale-down",
    "language": "Kubernetes",
    "code": "TCP RST",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When operating a Kubernetes cluster with IPVS mode enabled in kube-proxy, terminating pods can experience abrupt TCP connection resets (RST) during scale-down operations. This happens because the endpoint is immediately removed from the IPVS virtual server when the pod moves to a terminating state. However, incoming network packets for existing TCP streams are still routed via the LoadBalancer or NodePort, hitting nodes where IPVS has already purged the route, resulting in instantaneous RST packets being sent back to clients.</p>",
    "root_cause": "Kube-proxy running in IPVS mode instantly purges terminated endpoints from virtual server tables, ignoring existing TCP state if net.ipv4.vs.conn_reuse_mode is not optimized, causing any residual packets to fail IPVS routing lookup.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-service\nspec:\n  replicas: 5\n  template:\n    spec:\n      containers:\n      - name: web\n        image: web-app:1.0",
    "solution_desc": "Configure a preStop lifecycle hook in the container specification to sleep for a configurable period (e.g., 15 seconds). This keeps the container alive but terminating, allowing kube-proxy on all nodes to sync and stop routing new connections before the application receives the SIGTERM signal and ceases processing in-flight requests.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-service\nspec:\n  replicas: 5\n  template:\n    spec:\n      containers:\n      - name: web\n        image: web-app:1.0\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"sh\", \"-c\", \"sleep 15\"]\n      terminationGracePeriodSeconds: 45",
    "verification": "Execute a continuous traffic load test using tools like `wrk` or `vegeta` during a deployment rolling restart or downscale. Monitor HTTP status codes; they should remain 200 OK without any 502/504 errors or connection reset drops.",
    "date": "2026-07-21",
    "id": 1784612476,
    "type": "error"
});