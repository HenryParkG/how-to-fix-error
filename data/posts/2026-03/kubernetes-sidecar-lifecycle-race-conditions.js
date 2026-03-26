window.onPostDataLoaded({
    "title": "Debugging Sidecar Lifecycle Race Conditions in K8s",
    "slug": "kubernetes-sidecar-lifecycle-race-conditions",
    "language": "Go",
    "code": "JOB_STUCK_TERMINATING",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kubernetes Jobs frequently fail to reach the 'Completed' state because sidecar containers (like Cloud SQL Proxy or Istio Envoy) continue running after the main application container has exited. Since a Job is only considered complete when all containers terminate, the Job remains in a 'Running' state indefinitely, wasting resources and blocking CI/CD pipelines.</p>",
    "root_cause": "The Kubelet does not natively terminate non-primary containers in a Job once the primary process finishes unless using the SidecarContainers feature (K8s 1.29+).",
    "bad_code": "apiVersion: batch/v1\nkind: Job\nspec:\n  template:\n    spec:\n      containers:\n      - name: main-app\n        image: my-app\n      - name: sidecar\n        image: cloud-sql-proxy",
    "solution_desc": "For older clusters, use a shared process namespace and a wrapper script to kill the sidecar. For Modern K8s (1.29+), use the 'restartPolicy: Always' field within 'initContainers' which designates the container as a formal sidecar that terminates when the Job completes.",
    "good_code": "apiVersion: batch/v1\nkind: Job\nspec:\n  template:\n    spec:\n      containers:\n      - name: main-app\n        image: my-app\n      - name: sidecar\n        image: sidecar-image\n        # In 1.29+, this indicates a sidecar lifecycle\n        restartPolicy: Always",
    "verification": "Check `kubectl get jobs`. The Job should transition to 'Completed' within seconds of the main container exiting, and the sidecar should show a 'Terminated' status.",
    "date": "2026-03-26",
    "id": 1774488262,
    "type": "error"
});