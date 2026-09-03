window.onPostDataLoaded({
    "title": "Istio / Envoy: Graceful Draining Timeouts & Reset Storms",
    "slug": "istio-envoy-graceful-draining-connection-reset-storms",
    "language": "Istio / Envoy",
    "code": "ECONNRESET",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>During rolling deployments in Kubernetes clusters managed by Istio, terminating pods frequently drop active HTTP connections, triggering cascading `503 Service Unavailable` or `ECONNRESET` errors on downstream callers.</p><p>When a pod enters the `Terminating` state, the endpoint slice removal occurs asynchronously alongside kubelet container shutdown. Envoy proxies receive the SIGTERM signal and start their draining sequence, but if the drain duration is shorter than active request latencies or endpoint propagation times, active TCP sessions are abruptly terminated.</p>",
    "root_cause": "Envoy's `drainDuration` expires before kube-proxy and Ingress controllers remove the terminating pod from service routing tables, causing newly routed traffic to hit a shutting-down proxy, leading to hard TCP resets.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: order-service\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: order-service\n        image: order-service:v1\n        # Missing preStop hook and lifecycle coordination\n      terminationGracePeriodSeconds: 30",
    "solution_desc": "Synchronize Kubernetes `preStop` hooks with Istio sidecar drain configurations. Use `preStop` sleep intervals to allow upstream routers to remove the endpoint before Envoy cuts active listeners, and ensure `terminationGracePeriodSeconds` exceeds `drainDuration` plus in-flight request completion time.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: order-service\n  annotations:\n    # Configure Envoy sidecar draining parameters\n    proxy.istio.io/config: |\n      drainDuration: 25s\nspec:\n  replicas: 3\n  template:\n    spec:\n      terminationGracePeriodSeconds: 45\n      containers:\n      - name: order-service\n        image: order-service:v2\n        lifecycle:\n          preStop:\n            exec:\n              # Delay shutdown to ensure Kubernetes endpoint deregistration completes\n              command: [\"/bin/sh\", \"-c\", \"sleep 15\"]",
    "verification": "Execute continuous load testing with `hey -z 60s -c 50 http://order-service/` while triggering a rollout (`kubectl rollout restart deployment/order-service`). Confirm zero 503 errors and verify no `upstream_reset_before_response_started` flags in Envoy access logs.",
    "date": "2026-09-03",
    "id": 1788401415,
    "type": "error"
});