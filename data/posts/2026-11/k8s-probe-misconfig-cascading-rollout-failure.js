window.onPostDataLoaded({
    "title": "Fixing K8s Probe Failures & Cascading Rollouts",
    "slug": "k8s-probe-misconfig-cascading-rollout-failure",
    "language": "Kubernetes",
    "code": "CrashLoopBackOff",
    "tags": [
        "Kubernetes",
        "Docker",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>A common operational anti-pattern in Kubernetes deployments is coupling liveness probes with deep dependency validation (such as database connectivity or cache responsiveness). During a rolling update, new pods boot up simultaneously and bombard shared downstream dependencies, increasing initial latency.</p><p>When deep health endpoints slow down past `timeoutSeconds`, the kubelet fails the liveness probe and terminates the starting pod. Meanwhile, older pods are drained and terminated per rollout strategy. This causes surviving pods to absorb incoming cluster traffic, saturating them and triggering their own liveness failures. The cluster enters an unrecoverable cascading restart loop (`CrashLoopBackOff`).</p>",
    "root_cause": "Using deep dependency checks in `livenessProbe` instead of shallow process checks, lacking a `startupProbe` for slow initializations, and setting overly aggressive timeouts.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-service\nspec:\n  replicas: 5\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api-service:v2.1.0\n        livenessProbe:\n          # Anti-pattern: calls external DB and Redis\n          httpGet:\n            path: /health/deep\n            port: 8080\n          initialDelaySeconds: 5\n          periodSeconds: 5\n          timeoutSeconds: 1\n          failureThreshold: 2",
    "solution_desc": "Decouple probe responsibilities: use `startupProbe` to grant sufficient startup time for initializations, restrict `livenessProbe` to internal process responsiveness (e.g., deadlocks), and reserve dependency availability for `readinessProbe` with appropriate dampening.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-service\nspec:\n  replicas: 5\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api-service:v2.1.0\n        startupProbe:\n          httpGet:\n            path: /healthz/live\n            port: 8080\n          failureThreshold: 30\n          periodSeconds: 2\n        livenessProbe:\n          httpGet:\n            path: /healthz/live\n            port: 8080\n          periodSeconds: 10\n          timeoutSeconds: 3\n          failureThreshold: 3\n        readinessProbe:\n          httpGet:\n            path: /healthz/ready\n            port: 8080\n          periodSeconds: 5\n          timeoutSeconds: 2\n          failureThreshold: 2",
    "verification": "Execute `kubectl rollout restart deployment api-service` under artificial load. Inspect pod status with `kubectl get pods -w` and verify that pods gracefully complete startup without restart count increments (`Restarts: 0`).",
    "date": "2026-11-15",
    "id": 1794749047,
    "type": "error"
});