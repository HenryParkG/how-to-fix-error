window.onPostDataLoaded({
    "title": "Debugging Istio Envoy Proxy Connection Resets",
    "slug": "istio-envoy-connection-resets-termination",
    "language": "Kubernetes",
    "code": "ConnectionReset",
    "tags": [
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When a Kubernetes Pod is terminated, the kubelet sends a SIGTERM to the containers. In an Istio-enabled environment, if the Envoy sidecar exits before the application finishes processing active requests, or if the application tries to initiate new connections while Envoy is shutting down, clients receive 'Connection Reset' or 503 errors. This is caused by the asynchronous nature of pod termination where the sidecar and app don't coordinate their exit strategy.</p>",
    "root_cause": "The Envoy proxy terminates immediately upon receiving SIGTERM, often before the application container has drained its own connections, leading to broken network paths.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: my-app\nspec:\n  containers:\n  - name: app\n    image: my-app-image\n# Missing termination grace coordination",
    "solution_desc": "Implement a preStop hook in the application container to allow Envoy more time, and use the 'EXIT_ON_ZERO_ACTIVE_CONNECTIONS' feature or metadata annotations to ensure the proxy waits for the application.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      annotations:\n        proxy.istio.io/config: '{ \"terminationDrainDuration\": \"30s\" }'\n    spec:\n      containers:\n      - name: app\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/bin/sleep\", \"15\"]",
    "verification": "Perform a rolling update during a load test and monitor for 5xx errors or TCP resets in the Istio metrics.",
    "date": "2026-04-18",
    "id": 1776495443,
    "type": "error"
});