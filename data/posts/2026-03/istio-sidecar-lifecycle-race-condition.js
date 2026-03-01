window.onPostDataLoaded({
    "title": "Resolving Istio Sidecar Lifecycle Race Conditions",
    "slug": "istio-sidecar-lifecycle-race-condition",
    "language": "Kubernetes",
    "code": "EnvoyNotReady",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>During Kubernetes rolling updates, an application container may start and attempt to make outbound network calls before the Istio 'envoy' sidecar is fully ready to proxy traffic. Similarly, during shutdown, the sidecar may terminate before the application has finished flushing its final logs or closing active database connections, leading to 503 errors or connection resets during deployments.</p>",
    "root_cause": "Kubernetes does not guarantee container startup order within a Pod, leading to the application starting before the sidecar proxy is intercepting traffic.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    spec:\n      containers:\n      - name: app-container\n        image: my-app:latest\n        # No synchronization with sidecar",
    "solution_desc": "Enable the 'holdApplicationUntilProxyStarts' feature in Istio's proxy configuration. This injects a lifecycle postStart hook into the sidecar container or utilizes the newer sidecar startup ordering feature in Kubernetes 1.29+. For older versions, use a preStop hook to ensure the app finishes before Envoy stops.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      annotations:\n        proxy.istio.io/config: | \n          holdApplicationUntilProxyStarts: true\n    spec:\n      containers:\n      - name: app-container\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/bin/sh\", \"-c\", \"sleep 15\"]",
    "verification": "Perform a rolling update while running a 'curl' loop. Observe if any 503 Service Unavailable or Connection Refused errors occur during the transition.",
    "date": "2026-03-01",
    "id": 1772328184,
    "type": "error"
});