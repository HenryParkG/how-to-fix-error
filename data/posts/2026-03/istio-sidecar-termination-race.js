window.onPostDataLoaded({
    "title": "Fixing Istio Sidecar Race Conditions during Pod Shutdown",
    "slug": "istio-sidecar-termination-race",
    "language": "Kubernetes",
    "code": "ConnectionResetError",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes clusters using Istio, a race condition occurs during pod termination. When a Pod enters the 'Terminating' state, Kubelet sends a SIGTERM to all containers (App and Envoy sidecar) simultaneously. If the Envoy sidecar terminates faster than the application, the application loses its network egress path.</p><p>This leads to failed cleanup tasks, such as database connection closing, log flushing to external providers, or state updates to service discovery, as the proxy is no longer available to route traffic.</p>",
    "root_cause": "Parallel container termination in Kubernetes pods where the Istio proxy (Envoy) shuts down before the main application container completes its lifecycle hooks.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: my-app\nspec:\n  containers:\n  - name: app-container\n    image: my-app:latest\n  # No lifecycle management; sidecar may die first",
    "solution_desc": "Use a preStop hook in the Istio sidecar container to delay its shutdown. This ensures the application has a grace period to finish its work while the sidecar remains operational. Alternatively, enable the 'EXIT_ON_ZERO_ACTIVE_CONNECTIONS' feature in newer Istio versions.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      annotations:\n        # Delay sidecar exit until app container is likely done\n        proxy.istio.io/config: | \n          terminationDrainDuration: 30s\n    spec:\n      containers:\n      - name: app-container\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/bin/sleep\", \"15\"]",
    "verification": "Check application logs during a rolling update. Ensure that 'Connection Refused' errors disappear during the pod termination phase.",
    "date": "2026-03-13",
    "id": 1773394321,
    "type": "error"
});