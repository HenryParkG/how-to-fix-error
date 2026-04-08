window.onPostDataLoaded({
    "title": "Mitigating Kubernetes Sidecar Shutdown Race Conditions",
    "slug": "k8s-sidecar-graceful-shutdown-race",
    "language": "Kubernetes",
    "code": "SIGTERM-Race",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes, when a Pod is terminated, all containers receive the SIGTERM signal simultaneously. In architectures using sidecars (like Envoy, Istio, or Cloud SQL Proxy), the sidecar often shuts down before the main application has finished processing its remaining requests.</p><p>This causes the main application to fail when attempting to reach external services or the internet, resulting in 503 errors and broken database connections during rolling updates or scaling events.</p>",
    "root_cause": "Synchronous delivery of termination signals across all containers in a Pod, causing dependency failure.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: my-app\nspec:\n  containers:\n  - name: app-container\n    image: my-app:latest\n  - name: sidecar-proxy\n    image: proxy:latest",
    "solution_desc": "Implement a 'preStop' lifecycle hook in the sidecar container to delay its termination. This gives the main application enough time to finish active requests and close connections before the sidecar exits. Alternatively, use Kubernetes 1.29+ native SidecarContainers.",
    "good_code": "containers:\n- name: sidecar-proxy\n  image: proxy:latest\n  lifecycle:\n    preStop:\n      exec:\n        command: [\"/bin/sh\", \"-c\", \"sleep 20\"]",
    "verification": "Perform a rolling restart of the deployment and monitor the application logs for connection errors during the 'Terminating' phase.",
    "date": "2026-04-08",
    "id": 1775632109,
    "type": "error"
});