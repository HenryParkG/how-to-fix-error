window.onPostDataLoaded({
    "title": "Fix Istio Sidecar TCP Connection Resets in K8s Updates",
    "slug": "fix-istio-sidecar-tcp-connection-resets-rolling-updates",
    "language": "Go",
    "code": "ECONNRESET",
    "tags": [
        "Kubernetes",
        "Istio",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During Kubernetes rolling updates, pods terminating inside an Istio service mesh often drop active TCP streams with ECONNRESET errors. This race condition occurs because the Envoy sidecar proxy terminates before the main application container finishes draining active connections, or because endpoint removal signals fail to propagate through kube-proxy and Envoy xDS before the pod begins shutting down.</p>",
    "root_cause": "Race condition during pod termination: Envoy proxy receives SIGTERM and stops accepting incoming traffic or terminates immediately, while application containers are still processing active HTTP/TCP requests, sending TCP RST packets back to callers.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  replicas: 3\n  template:\n    metadata:\n      labels:\n        app: payment-service\n    spec:\n      containers:\n      - name: payment-service\n        image: payment-service:v1.0.0\n        # Missing lifecycle hooks and drain delay configurations",
    "solution_desc": "Configure `preStop` sleep lifecycle hooks on application containers to wait for endpoint propagation, and set Istio proxy annotations `drainDuration` and `parentShutdownDuration` to ensure Envoy gracefully drains active connections before shutting down.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  replicas: 3\n  template:\n    metadata:\n      annotations:\n        proxy.istio.io/config: |\n          drainDuration: 15s\n          parentShutdownDuration: 20s\n      labels:\n        app: payment-service\n    spec:\n      terminationGracePeriodSeconds: 45\n      containers:\n      - name: payment-service\n        image: payment-service:v1.0.0\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/bin/sh\", \"-c\", \"sleep 10\"]",
    "verification": "Execute continuous HTTP load testing using `k6` or `fortio` during `kubectl rollout restart deployment/payment-service`. Verify zero HTTP 502/503 responses or TCP reset connection errors.",
    "date": "2026-07-31",
    "id": 1785477392,
    "type": "error"
});