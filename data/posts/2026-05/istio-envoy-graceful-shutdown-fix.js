window.onPostDataLoaded({
    "title": "Mitigating Envoy Sidecar Race Conditions in K8s",
    "slug": "istio-envoy-graceful-shutdown-fix",
    "language": "Go",
    "code": "ERR_CONNECTION_RESET",
    "tags": [
        "Kubernetes",
        "Istio",
        "Envoy",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio-enabled Kubernetes cluster, a common issue occurs during Pod termination: the Envoy sidecar proxy may shut down before the main application container finishes processing in-flight requests. Since Kubernetes sends the SIGTERM signal to all containers simultaneously, Envoy stops accepting new connections and may terminate existing ones immediately.</p><p>This results in '503 Service Unavailable' or 'Connection Reset' errors for clients during rolling updates or scaling events, breaking the promise of zero-downtime deployments.</p>",
    "root_cause": "The parallel termination of containers in a Pod allows the Envoy proxy to exit while the application still requires network connectivity to finish its graceful shutdown or drain its work queue.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    spec:\n      containers:\n      - name: app\n        image: my-app:latest\n# No lifecycle management for sidecar synchronization",
    "solution_desc": "Use a preStop hook in the application container to delay its shutdown, or better, configure Istio's `EXIT_ON_ZERO_ACTIVE_CONNECTIONS` and use the `pilot-agent` to ensure the proxy stays alive until the app container terminates.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      annotations:\n        proxy.istio.io/config: |\n          terminationDrainDuration: 30s\n    spec:\n      containers:\n      - name: app\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/bin/sh\", \"-c\", \"sleep 15\"]",
    "verification": "Perform a rolling update while running a load test (e.g., using 'fortio'). Monitor the success rate; it should remain at 100% without 503/504 errors during the transition.",
    "date": "2026-05-11",
    "id": 1778465453,
    "type": "error"
});