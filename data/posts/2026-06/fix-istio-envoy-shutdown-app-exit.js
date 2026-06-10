window.onPostDataLoaded({
    "title": "Fixing Envoy Sidecar Terminations in Istio Shutdowns",
    "slug": "fix-istio-envoy-shutdown-app-exit",
    "language": "Kubernetes",
    "code": "HTTP 503 Service Unavailable",
    "tags": [
        "Kubernetes",
        "Istio",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In microservice architectures deployed on Kubernetes with an Istio service mesh, a common failure pattern occurs when pods are terminated during deployments or scale-downs. When a Pod enters the termination sequence, the Kubernetes Kubelet broadcasts the SIGTERM signal to all containers (including both the application container and the Istio Envoy sidecar container) simultaneously. This causes Envoy to shut down its inbound and outbound proxy configurations immediately.</p><p>If the application container has dynamic or long-running operations and is still executing active requests during its own graceful shutdown period, it will attempt to route outbound network calls or database queries through the Envoy sidecar. However, because Envoy is already terminating or dead, the network connection fails instantly, leading to 503 Service Unavailable errors and broken pipelines during rolling deployments.</p>",
    "root_cause": "The simultaneous delivery of the SIGTERM signal to both the main application container and the Envoy proxy sidecar, cutting off the application's outbound networking capabilities before it finishes graceful shutdown.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: payment-app\n        image: payment-app:latest\n        # BUG: No lifecycle hooks to await Envoy or delay container termination.\n        # The application will fail outbound transactions if Envoy dies first.",
    "date": "2026-06-10",
    "id": 1781058924,
    "type": "error"
});